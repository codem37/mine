import { open, stat, unlink } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";
import type { DownloadItem, DownloadSegment, DownloadState } from "@mine/contracts";
import { extractFilenameFromUrl, probeUrl, sanitizeFilename, type ProbeResult } from "./probe.js";

export interface SegmentState {
  id: number;
  startByte: number;
  endByte: number;
  downloadedBytes: number;
  active: boolean;
  done: boolean;
}

export interface SegmentedDownloadOptions {
  readonly id: string;
  readonly url: string;
  readonly filename?: string;
  readonly saveDir: string;
  readonly segmentCount?: number;
  readonly headers?: Record<string, string>;
  readonly onUpdate?: (item: DownloadItem) => void;
}

export class SegmentedDownload {
  readonly id: string;
  readonly url: string;
  private filename: string;
  private savePath: string;
  private state: DownloadState = "queued";
  private totalBytes = 0;
  private downloadedBytes = 0;
  private speedBytesPerSec = 0;
  private etaSeconds: number | null = null;
  private segments: SegmentState[] = [];
  private readonly segmentCount: number;
  private readonly saveDir: string;
  private readonly headers: Record<string, string>;
  private readonly onUpdate?: (item: DownloadItem) => void;
  private abortController: AbortController | null = null;
  private fileHandle: FileHandle | null = null;
  private speedInterval: ReturnType<typeof setInterval> | null = null;
  private lastSampleBytes = 0;
  private lastSampleTime = Date.now();
  private errorMessage: string | null = null;

  private readonly optionsHasFilename: boolean;

  constructor(options: SegmentedDownloadOptions) {
    this.id = options.id;
    this.url = options.url;
    this.optionsHasFilename = Boolean(options.filename);
    this.filename = sanitizeFilename(options.filename ?? extractFilenameFromUrl(options.url));
    this.saveDir = options.saveDir;
    this.savePath = path.join(this.saveDir, this.filename);
    this.segmentCount = options.segmentCount ?? 8;
    this.headers = options.headers ?? {};
    this.onUpdate = options.onUpdate;
  }

  getSnapshot(): DownloadItem {
    return {
      id: this.id,
      filename: this.filename,
      url: this.url,
      savePath: this.savePath,
      state: this.state,
      downloadedBytes: this.downloadedBytes,
      totalBytes: this.totalBytes,
      speedBytesPerSec: this.speedBytesPerSec,
      etaSeconds: this.etaSeconds,
      segments: this.segments.map((s) => {
        const segTotal = Math.max(1, s.endByte - s.startByte + 1);
        const percent = Math.min(100, Math.round((s.downloadedBytes / segTotal) * 100));
        return {
          id: s.id,
          startByte: s.startByte,
          endByte: s.endByte,
          downloadedBytes: s.downloadedBytes,
          progressPercent: percent,
          active: s.active,
        };
      }),
      errorMessage: this.errorMessage,
    };
  }

  private notify(): void {
    this.onUpdate?.(this.getSnapshot());
  }

  async start(): Promise<void> {
    if (this.state === "downloading" || this.state === "completed") return;

    this.state = "downloading";
    this.errorMessage = null;
    this.abortController = new AbortController();
    this.startSpeedSampler();
    this.notify();

    try {
      const probe = await probeUrl(this.url, {
        headers: this.headers,
        signal: this.abortController.signal,
      });

      if (this.abortController.signal.aborted) return;

      if (!this.optionsHasFilename && probe.filename) {
        this.filename = sanitizeFilename(probe.filename);
        const resolvedDir = path.resolve(this.saveDir);
        const resolvedPath = path.resolve(resolvedDir, this.filename);
        if (!resolvedPath.startsWith(resolvedDir)) {
          throw new Error("Security check failed: filename attempted path traversal out of saveDir");
        }
        this.savePath = resolvedPath;
      }

      this.totalBytes = probe.contentLength;

      if (probe.acceptsRanges && probe.contentLength > 0) {
        await this.runSegmented(probe);
      } else {
        await this.runSingleStream();
      }
    } catch (err: unknown) {
      if (this.abortController?.signal.aborted) return;
      this.state = "failed";
      this.errorMessage = err instanceof Error ? err.message : String(err);
      this.stopSpeedSampler();
      await this.cleanupFileHandle();
      this.notify();
    }
  }

  private async runSegmented(probe: ProbeResult): Promise<void> {
    this.totalBytes = probe.contentLength;
    const count = Math.min(this.segmentCount, Math.max(1, Math.floor(this.totalBytes / (64 * 1024))));

    if (this.segments.length === 0) {
      const chunkSize = Math.floor(this.totalBytes / count);
      this.segments = [];
      for (let i = 0; i < count; i++) {
        const startByte = i * chunkSize;
        const endByte = i === count - 1 ? this.totalBytes - 1 : (i + 1) * chunkSize - 1;
        this.segments.push({
          id: i,
          startByte,
          endByte,
          downloadedBytes: 0,
          active: false,
          done: false,
        });
      }
    }

    // Open target file
    this.fileHandle = await open(this.savePath, "w+");
    await this.fileHandle.truncate(this.totalBytes);

    const workers = this.segments.map((seg) => this.downloadSegment(seg));
    await Promise.all(workers);

    if (this.abortController?.signal.aborted) return;

    // Check all segments completed
    const allDone = this.segments.every((s) => s.done);
    if (allDone) {
      await this.cleanupFileHandle();
      this.state = "completed";
      this.speedBytesPerSec = 0;
      this.etaSeconds = 0;
      this.downloadedBytes = this.totalBytes;
      this.stopSpeedSampler();
      this.notify();
    }
  }

  private async downloadSegment(seg: SegmentState): Promise<void> {
    if (seg.done) return;
    const currentStart = seg.startByte + seg.downloadedBytes;
    if (currentStart > seg.endByte) {
      seg.done = true;
      seg.active = false;
      return;
    }

    seg.active = true;
    this.notify();

    try {
      const res = await fetch(this.url, {
        headers: {
          ...this.headers,
          Range: `bytes=${currentStart}-${seg.endByte}`,
        },
        signal: this.abortController?.signal,
      });

      if (res.status === 200 && seg.id === 0) {
        // Server ignored range header! Fall back to streaming entire file directly
        await this.handleRangeFallback(res);
        return;
      }

      if (!res.ok && res.status !== 206) {
        throw new Error(`HTTP error ${res.status} on segment ${seg.id}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable body stream");

      let writeOffset = currentStart;

      while (true) {
        if (this.abortController?.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        if (value && this.fileHandle) {
          await this.fileHandle.write(value, 0, value.length, writeOffset);
          writeOffset += value.length;
          seg.downloadedBytes += value.length;
          this.recalculateTotals();
          this.notify();
        }
      }

      if (writeOffset >= seg.endByte + 1) {
        seg.done = true;
      }
    } finally {
      seg.active = false;
    }
  }

  private async handleRangeFallback(res: Response): Promise<void> {
    for (const seg of this.segments) {
      if (seg.id !== 0) {
        seg.active = false;
        seg.done = false;
      }
    }
    this.segments = [
      {
        id: 0,
        startByte: 0,
        endByte: this.totalBytes > 0 ? this.totalBytes - 1 : 0,
        downloadedBytes: 0,
        active: true,
        done: false,
      },
    ];

    if (this.fileHandle) {
      await this.fileHandle.truncate(0);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No readable body stream");

    let offset = 0;
    while (true) {
      if (this.abortController?.signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      if (value && this.fileHandle) {
        await this.fileHandle.write(value, 0, value.length, offset);
        offset += value.length;
        this.downloadedBytes = offset;
        this.segments[0]!.downloadedBytes = offset;
        this.notify();
      }
    }

    if (!this.abortController?.signal.aborted) {
      this.segments[0]!.done = true;
      this.segments[0]!.active = false;
      await this.cleanupFileHandle();
      this.state = "completed";
      this.speedBytesPerSec = 0;
      this.etaSeconds = 0;
      this.stopSpeedSampler();
      this.notify();
    }
  }

  private async runSingleStream(): Promise<void> {
    this.segments = [
      {
        id: 0,
        startByte: 0,
        endByte: this.totalBytes > 0 ? this.totalBytes - 1 : 0,
        downloadedBytes: 0,
        active: true,
        done: false,
      },
    ];

    const res = await fetch(this.url, {
      headers: this.headers,
      signal: this.abortController?.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    this.fileHandle = await open(this.savePath, "w+");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No readable body stream");

    let offset = 0;
    while (true) {
      if (this.abortController?.signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      if (value && this.fileHandle) {
        await this.fileHandle.write(value, 0, value.length, offset);
        offset += value.length;
        this.downloadedBytes = offset;
        this.segments[0]!.downloadedBytes = offset;
        this.notify();
      }
    }

    if (!this.abortController?.signal.aborted) {
      this.segments[0]!.done = true;
      this.segments[0]!.active = false;
      await this.cleanupFileHandle();
      this.state = "completed";
      this.speedBytesPerSec = 0;
      this.etaSeconds = 0;
      this.stopSpeedSampler();
      this.notify();
    }
  }

  private recalculateTotals(): void {
    let total = 0;
    for (const seg of this.segments) {
      total += seg.downloadedBytes;
    }
    this.downloadedBytes = total;
  }

  pause(): void {
    if (this.state !== "downloading" && this.state !== "resuming") return;
    this.state = "paused";
    this.abortController?.abort();
    this.stopSpeedSampler();
    this.speedBytesPerSec = 0;
    for (const seg of this.segments) {
      seg.active = false;
    }
    void this.cleanupFileHandle();
    this.notify();
  }

  async resume(): Promise<void> {
    if (this.state !== "paused" && this.state !== "failed") return;

    if (this.totalBytes === 0 || this.segments.length === 0) {
      this.state = "queued";
      await this.start();
      return;
    }

    this.state = "resuming";
    this.errorMessage = null;
    this.abortController = new AbortController();
    this.startSpeedSampler();
    this.notify();

    try {
      // Reopen file in r+ mode (or w+ if not yet created)
      try {
        this.fileHandle = await open(this.savePath, "r+");
      } catch {
        this.fileHandle = await open(this.savePath, "w+");
        if (this.totalBytes > 0) {
          await this.fileHandle.truncate(this.totalBytes);
        }
      }
      this.state = "downloading";
      this.notify();

      if (this.segments.length > 1) {
        const workers = this.segments
          .filter((s) => !s.done)
          .map((seg) => this.downloadSegment(seg));
        await Promise.all(workers);
      } else {
        // Resume single stream if possible with Range
        const seg = this.segments[0];
        if (seg && !seg.done) {
          const res = await fetch(this.url, {
            headers: {
              ...this.headers,
              Range: `bytes=${seg.downloadedBytes}-`,
            },
            signal: this.abortController?.signal,
          });

          if (res.status === 206) {
            const reader = res.body?.getReader();
            if (!reader) throw new Error("No body");
            let offset = seg.downloadedBytes;
            while (true) {
              if (this.abortController?.signal.aborted) break;
              const { done, value } = await reader.read();
              if (done) break;
              if (value && this.fileHandle) {
                await this.fileHandle.write(value, 0, value.length, offset);
                offset += value.length;
                this.downloadedBytes = offset;
                seg.downloadedBytes = offset;
                this.notify();
              }
            }
          } else {
            // Cannot resume single stream with range, restart single stream
            await this.runSingleStream();
          }
        }
      }

      if (this.abortController?.signal.aborted) return;

      const allDone = this.segments.every((s) => s.done);
      if (allDone) {
        await this.cleanupFileHandle();
        this.state = "completed";
        this.speedBytesPerSec = 0;
        this.etaSeconds = 0;
        this.stopSpeedSampler();
        this.notify();
      }
    } catch (err: unknown) {
      if (this.abortController?.signal.aborted) return;
      this.state = "failed";
      this.errorMessage = err instanceof Error ? err.message : String(err);
      this.stopSpeedSampler();
      await this.cleanupFileHandle();
      this.notify();
    }
  }

  cancel(): void {
    this.state = "cancelled";
    this.abortController?.abort();
    this.stopSpeedSampler();
    this.speedBytesPerSec = 0;
    this.etaSeconds = null;
    for (const seg of this.segments) {
      seg.active = false;
    }
    void this.cleanupFileHandle();
    this.notify();
  }

  async retry(): Promise<void> {
    this.cancel();
    this.downloadedBytes = 0;
    this.segments = [];
    try {
      await unlink(this.savePath);
    } catch {
      // ignore
    }
    await this.start();
  }

  private startSpeedSampler(): void {
    this.stopSpeedSampler();
    this.lastSampleBytes = this.downloadedBytes;
    this.lastSampleTime = Date.now();

    this.speedInterval = setInterval(() => {
      const now = Date.now();
      const timeDelta = (now - this.lastSampleTime) / 1000;
      if (timeDelta > 0.4) {
        const bytesDelta = this.downloadedBytes - this.lastSampleBytes;
        this.speedBytesPerSec = Math.max(0, Math.round(bytesDelta / timeDelta));
        this.lastSampleBytes = this.downloadedBytes;
        this.lastSampleTime = now;

        if (this.totalBytes > 0 && this.speedBytesPerSec > 0) {
          const remaining = Math.max(0, this.totalBytes - this.downloadedBytes);
          this.etaSeconds = Math.round(remaining / this.speedBytesPerSec);
        } else {
          this.etaSeconds = null;
        }
        this.notify();
      }
    }, 500);
  }

  private stopSpeedSampler(): void {
    if (this.speedInterval !== null) {
      clearInterval(this.speedInterval);
      this.speedInterval = null;
    }
  }

  private async cleanupFileHandle(): Promise<void> {
    if (this.fileHandle !== null) {
      try {
        await this.fileHandle.close();
      } catch {
        // ignore
      }
      this.fileHandle = null;
    }
  }
}
