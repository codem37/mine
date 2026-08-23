import os from "node:os";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import type { DownloadItem } from "@mine/contracts";
import { SegmentedDownload } from "./segmented.js";
import { TorrentDownload } from "./torrent.js";

export interface StartDownloadOptions {
  readonly filename?: string;
  readonly saveDir?: string;
  readonly headers?: Record<string, string>;
  readonly segmentCount?: number;
}

export class DownloadEngine {
  private readonly downloads = new Map<string, SegmentedDownload | TorrentDownload>();
  private readonly listeners = new Set<(downloads: DownloadItem[]) => void>();
  private nextId = 1;
  private readonly defaultSaveDir: string;

  constructor(defaultSaveDir?: string) {
    this.defaultSaveDir = defaultSaveDir ?? path.join(os.homedir(), "Downloads");
  }

  on(listener: (downloads: DownloadItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const list = this.getDownloads();
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch {
        // ignore listener errors
      }
    }
  }

  getDownloads(): DownloadItem[] {
    return Array.from(this.downloads.values()).map((d) => d.getSnapshot());
  }

  getDownload(id: string): DownloadItem | undefined {
    return this.downloads.get(id)?.getSnapshot();
  }

  async startDownload(urlString: string, options: StartDownloadOptions = {}): Promise<DownloadItem> {
    const id = `dl-${this.nextId++}`;
    const saveDir = options.saveDir ?? this.defaultSaveDir;
    await mkdir(saveDir, { recursive: true });

    let download: SegmentedDownload | TorrentDownload;

    if (urlString.startsWith("magnet:?")) {
      download = new TorrentDownload({
        id,
        magnetUri: urlString,
        saveDir,
        onUpdate: () => this.notify(),
      });
    } else {
      download = new SegmentedDownload({
        id,
        url: urlString,
        filename: options.filename,
        saveDir,
        headers: options.headers,
        segmentCount: options.segmentCount ?? 8,
        onUpdate: () => this.notify(),
      });
    }

    this.downloads.set(id, download);
    this.notify();
    void download.start();
    return download.getSnapshot();
  }

  pause(id: string): void {
    this.downloads.get(id)?.pause();
  }

  async resume(id: string): Promise<void> {
    await this.downloads.get(id)?.resume();
  }

  cancel(id: string): void {
    this.downloads.get(id)?.cancel();
  }

  async retry(id: string): Promise<void> {
    await this.downloads.get(id)?.retry();
  }

  async removeDownload(id: string, deleteFromDisk = false): Promise<void> {
    const item = this.downloads.get(id);
    if (!item) return;
    item.cancel();
    if (deleteFromDisk) {
      const snap = item.getSnapshot();
      if (snap.savePath) {
        try {
          const { unlink } = await import("node:fs/promises");
          await unlink(snap.savePath);
        } catch {
          // ignore unlink error
        }
      }
    }
    this.downloads.delete(id);
    this.notify();
  }

  dispose(): void {
    for (const d of this.downloads.values()) {
      d.cancel();
    }
    this.downloads.clear();
    this.listeners.clear();
  }
}
