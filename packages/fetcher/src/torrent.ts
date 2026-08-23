import { open, unlink } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";
import type { DownloadItem, DownloadSegment, DownloadState } from "@mine/contracts";

export interface MagnetMetadata {
  readonly infoHash: string;
  readonly name: string;
  readonly trackers: readonly string[];
  readonly exactLength?: number;
}

export function parseMagnetUri(uri: string): MagnetMetadata | null {
  if (!uri.startsWith("magnet:?")) return null;
  const rawParams = uri.slice("magnet:?".length);
  const searchParams = new URLSearchParams(rawParams);

  const xt = searchParams.get("xt");
  if (!xt || !xt.toLowerCase().startsWith("urn:btih:")) return null;

  const infoHash = xt.slice("urn:btih:".length).toLowerCase();
  const name = searchParams.get("dn") || `torrent-${infoHash.slice(0, 8)}`;
  const trackers = searchParams.getAll("tr");
  const xl = searchParams.get("xl");
  const exactLength = xl ? Number.parseInt(xl, 10) : undefined;

  return {
    infoHash,
    name,
    trackers,
    exactLength: Number.isFinite(exactLength) ? exactLength : undefined,
  };
}

interface TorrentSegmentState {
  id: number;
  startByte: number;
  endByte: number;
  downloadedBytes: number;
  progressPercent: number;
  active: boolean;
}

export interface TorrentDownloadOptions {
  readonly id: string;
  readonly magnetUri: string;
  readonly saveDir: string;
  readonly onUpdate?: (item: DownloadItem) => void;
}

export class TorrentDownload {
  readonly id: string;
  readonly url: string;
  readonly infoHash: string;
  private filename: string;
  private savePath: string;
  private state: DownloadState = "queued";
  private totalBytes = 0;
  private downloadedBytes = 0;
  private speedBytesPerSec = 0;
  private etaSeconds: number | null = null;
  private peersCount = 0;
  private segments: TorrentSegmentState[] = [];
  private readonly saveDir: string;
  private readonly onUpdate?: (item: DownloadItem) => void;
  private abortController: AbortController | null = null;
  private fileHandle: FileHandle | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  private errorMessage?: string;

  constructor(options: TorrentDownloadOptions) {
    this.id = options.id;
    this.url = options.magnetUri;
    this.saveDir = options.saveDir;
    this.onUpdate = options.onUpdate;

    const parsed = parseMagnetUri(options.magnetUri);
    this.infoHash = parsed?.infoHash ?? "unknown";
    this.filename = parsed?.name ?? `torrent-${this.infoHash.slice(0, 8)}.bin`;
    this.savePath = path.join(this.saveDir, this.filename);
    this.totalBytes = parsed?.exactLength ?? 10 * 1024 * 1024; // default 10MB if unstated
  }

  getSnapshot(): DownloadItem {
    return {
      id: this.id,
      filename: this.filename,
      url: this.url,
      savePath: this.savePath,
      state: this.state,
      errorMessage: this.errorMessage,
      downloadedBytes: this.downloadedBytes,
      totalBytes: this.totalBytes,
      speedBytesPerSec: this.speedBytesPerSec,
      etaSeconds: this.etaSeconds,
      segments: this.segments.map((s) => ({
        id: s.id,
        startByte: s.startByte,
        endByte: s.endByte,
        downloadedBytes: s.downloadedBytes,
        progressPercent: s.progressPercent,
        active: s.active,
      })),
      isTorrent: true,
      peersCount: this.peersCount,
    };
  }

  private notify(): void {
    this.onUpdate?.(this.getSnapshot());
  }

  async start(): Promise<void> {
    if (this.state === "downloading" || this.state === "completed") return;

    this.state = "failed";
    this.errorMessage = "BitTorrent protocol engine unavailable. Native P2P BitTorrent library required for torrent transfers.";
    this.peersCount = 0;
    this.speedBytesPerSec = 0;
    this.notify();
  }

  private initSegments(count: number): void {
    this.segments = [];
    const chunkSize = Math.floor(this.totalBytes / count);
    for (let i = 0; i < count; i++) {
      const startByte = i * chunkSize;
      const endByte = i === count - 1 ? this.totalBytes - 1 : (i + 1) * chunkSize - 1;
      this.segments.push({
        id: i,
        startByte,
        endByte,
        downloadedBytes: 0,
        progressPercent: 0,
        active: i === 0,
      });
    }
  }

  pause(): void {
    if (this.state !== "downloading") return;
    this.state = "paused";
    this.stopTimer();
    this.speedBytesPerSec = 0;
    for (const s of this.segments) s.active = false;
    this.notify();
  }

  async resume(): Promise<void> {
    if (this.state !== "paused") return;
    await this.start();
  }

  cancel(): void {
    this.state = "cancelled";
    this.stopTimer();
    this.speedBytesPerSec = 0;
    this.etaSeconds = null;
    for (const s of this.segments) s.active = false;
    void this.cleanup();
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

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.fileHandle) {
      try {
        await this.fileHandle.close();
      } catch {
        // ignore
      }
      this.fileHandle = null;
    }
  }
}
