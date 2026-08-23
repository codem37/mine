import type {
  EqualizerState,
  MediaHistoryItem,
  MediaItemDownloadRequest,
  MediaQueueItem,
  MediaSource,
  PlayerState,
  VideoTransform,
} from "@mine/contracts";
import { sniffMediaStream, type SniffRequest } from "./sniffer.js";
import { MediaManager } from "./manager.js";
import { NativePlayer, type PlayerOptions } from "./player.js";
import { MediaQueueManager } from "./queue.js";
import { MediaHistoryStore } from "./history.js";

export class MediaEngine {
  private readonly sources = new Map<string, MediaSource>();
  private readonly manager = new MediaManager();
  private readonly player = new NativePlayer();
  private readonly queueManager = new MediaQueueManager();
  private readonly historyStore = new MediaHistoryStore();

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
    this.player.setActiveTabMediaCount(list.length);
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
      if (!this.sources.has(source.id)) {
        const resumePos = this.manager.getResumePosition(source.id);
        const updatedSource = resumePos > 0 ? { ...source, playbackPosition: resumePos } : source;
        this.sources.set(source.id, updatedSource);
        this.historyStore.add(updatedSource);
        this.notifyStreams();
      }
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

    if (source) {
      this.historyStore.add(source);
      this.queueManager.add(source);
    }

    const ok = this.player.play(urlString, { ...options, startPosition: startPos });
    this.notifyPlayerState();
    return ok;
  }

  controlPlayer(action: string, value?: unknown): void {
    if (action === "play") this.player.resume();
    else if (action === "pause") this.player.pause();
    else if (action === "seek" && typeof value === "number") this.player.seek(value);
    else if (action === "setVolume" && typeof value === "number") this.player.setVolume(value);
    else if (action === "setVolumeBoost" && typeof value === "number") this.player.setVolumeBoost(value);
    else if (action === "setSpeed" && typeof value === "number") this.player.setSpeed(value);
    else if (action === "stepFrame" && typeof value === "boolean") this.player.stepFrame(value);
    else if (action === "setSubtitleOffset" && typeof value === "number") this.player.setSubtitleOffset(value);
    else if (action === "setAudioOffset" && typeof value === "number") this.player.setAudioOffset(value);
    else if (action === "setVideoTransform" && typeof value === "object" && value !== null) {
      this.player.setVideoTransform(value as Partial<VideoTransform>);
    } else if (action === "setEqualizer" && typeof value === "object" && value !== null) {
      this.player.setEqualizer(value as Partial<EqualizerState>);
    } else if (action === "setABLoop") {
      const range = Array.isArray(value) && value.length === 2 ? (value as [number, number]) : null;
      this.player.setABLoop(range);
    }
    this.notifyPlayerState();
  }

  getPlayerState(): PlayerState {
    return this.player.getState();
  }

  // Queue APIs
  getQueue(): readonly MediaQueueItem[] {
    return this.queueManager.getQueue();
  }

  addToQueue(sourceId: string): MediaQueueItem | null {
    const source = this.sources.get(sourceId);
    if (!source) return null;
    return this.queueManager.add(source);
  }

  removeFromQueue(id: string): void {
    this.queueManager.remove(id);
  }

  clearQueue(): void {
    this.queueManager.clear();
  }

  // History APIs
  getHistory(): readonly MediaHistoryItem[] {
    return this.historyStore.getHistory();
  }

  clearHistory(): void {
    this.historyStore.clear();
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
