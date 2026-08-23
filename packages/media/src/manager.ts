import type { MediaItemDownloadRequest, MediaSource } from "@mine/contracts";

export class MediaResumeStorage {
  private readonly storage = new Map<string, number>();

  savePosition(sourceId: string, seconds: number): void {
    if (seconds > 5) {
      this.storage.set(sourceId, Math.floor(seconds));
    }
  }

  getPosition(sourceId: string): number {
    return this.storage.get(sourceId) ?? 0;
  }

  clear(sourceId?: string): void {
    if (sourceId) this.storage.delete(sourceId);
    else this.storage.clear();
  }
}

export class MediaManager {
  private readonly resumeStorage = new MediaResumeStorage();

  selectPrimarySource(sources: readonly MediaSource[], activeId?: string | null): MediaSource | null {
    if (sources.length === 0) return null;
    if (activeId) {
      const match = sources.find((s) => s.id === activeId);
      if (match) return match;
    }
    // Priority: 1. Direct/HLS non-DRM, 2. First non-DRM, 3. Fallback first
    const primary = sources.find((s) => !s.isDrmProtected) ?? sources[0] ?? null;
    return primary;
  }

  createDownloadRequest(source: MediaSource, quality?: string): MediaItemDownloadRequest {
    return {
      sourceId: source.id,
      url: source.url,
      title: source.title || "media-download",
      quality: quality || "Auto",
      format: source.format,
    };
  }

  getResumePosition(sourceId: string): number {
    return this.resumeStorage.getPosition(sourceId);
  }

  saveResumePosition(sourceId: string, seconds: number): void {
    this.resumeStorage.savePosition(sourceId, seconds);
  }
}
