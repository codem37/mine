import type { MediaItemDownloadRequest, MediaSource, PlayerState } from "@mine/contracts";
import { sniffMediaStream, type SniffRequest } from "./sniffer.js";
import { MediaManager } from "./manager.js";
import { NativePlayer, type PlayerOptions } from "./player.js";

export class MediaEngine {
  private readonly sources = new Map<string, MediaSource>();
  private readonly manager = new MediaManager();
  private readonly player = new NativePlayer();
  private readonly streamListeners = new Set<(sources: MediaSource[]) => void>();
  private readonly playerListeners = new Set<(state: PlayerState) => void>();

  onStreamDetected(listener: (sources: MediaSource[]) => void): () => void {
    this.streamListeners.add(listener);
    return () => {
      this.streamListeners.delete(listener);
    };
  }

  onPlayerStateChanged(listener: (state: PlayerState) => void): () => void {
    this.playerListeners.add(listener);
    return () => {
      this.playerListeners.delete(listener);
    };
  }

  private notifyStreams(): void {
    const list = this.getSources();
    for (const listener of this.streamListeners) {
      try {
        listener(list);
      } catch {
        // ignore
      }
    }
  }

  private notifyPlayerState(): void {
    const state = this.player.getState();
    for (const listener of this.playerListeners) {
      try {
        listener(state);
      } catch {
        // ignore
      }
    }
  }

  inspectRequest(req: SniffRequest): MediaSource | null {
    const source = sniffMediaStream(req);
    if (source !== null) {
      const resumePos = this.manager.getResumePosition(source.id);
      const updatedSource = resumePos > 0 ? { ...source, playbackPosition: resumePos } : source;
      this.sources.set(source.id, updatedSource);
      this.notifyStreams();
    }
    return source;
  }

  getSources(): MediaSource[] {
    return Array.from(this.sources.values());
  }

  getPrimarySource(activeId?: string | null): MediaSource | null {
    return this.manager.selectPrimarySource(this.getSources(), activeId);
  }

  createDownloadRequest(sourceId: string, quality?: string): MediaItemDownloadRequest | null {
    const source = this.sources.get(sourceId);
    if (!source) return null;
    return this.manager.createDownloadRequest(source, quality);
  }

  playNative(urlString: string, options: PlayerOptions = {}): boolean {
    const source = Array.from(this.sources.values()).find((s) => s.url === urlString);
    const startPos = options.startPosition ?? (source ? this.manager.getResumePosition(source.id) : 0);

    const ok = this.player.play(urlString, { ...options, startPosition: startPos });
    this.notifyPlayerState();
    return ok;
  }

  controlPlayer(action: string, value?: unknown): void {
    if (action === "play") this.player.resume();
    else if (action === "pause") this.player.pause();
    else if (action === "seek" && typeof value === "number") this.player.seek(value);
    else if (action === "setVolume" && typeof value === "number") this.player.setVolume(value);
    else if (action === "setSpeed" && typeof value === "number") this.player.setSpeed(value);
    else if (action === "stepFrame" && typeof value === "boolean") this.player.stepFrame(value);
    else if (action === "setSubtitleOffset" && typeof value === "number") this.player.setSubtitleOffset(value);
    else if (action === "setAudioOffset" && typeof value === "number") this.player.setAudioOffset(value);
    else if (action === "setABLoop") {
      const range = Array.isArray(value) && value.length === 2 ? (value as [number, number]) : null;
      this.player.setABLoop(range);
    }
    this.notifyPlayerState();
  }

  getPlayerState(): PlayerState {
    return this.player.getState();
  }

  savePlaybackPosition(sourceId: string, seconds: number): void {
    this.manager.saveResumePosition(sourceId, seconds);
  }

  stopNative(): void {
    this.player.stop();
    this.notifyPlayerState();
  }

  clear(): void {
    this.sources.clear();
    this.notifyStreams();
  }
}
