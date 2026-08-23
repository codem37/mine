import type { MediaStream } from "@mine/contracts";
import { sniffMediaStream, type SniffRequest } from "./sniffer.js";
import { NativePlayer, type PlayerOptions } from "./player.js";

export class MediaEngine {
  private readonly streams = new Map<string, MediaStream>();
  private readonly listeners = new Set<(streams: MediaStream[]) => void>();
  private readonly player = new NativePlayer();

  on(listener: (streams: MediaStream[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const list = this.getStreams();
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch {
        // ignore
      }
    }
  }

  inspectRequest(req: SniffRequest): MediaStream | null {
    const stream = sniffMediaStream(req);
    if (stream !== null) {
      this.streams.set(stream.id, stream);
      this.notify();
    }
    return stream;
  }

  getStreams(): MediaStream[] {
    return Array.from(this.streams.values());
  }

  playNative(urlString: string, options: PlayerOptions = {}): boolean {
    return this.player.play(urlString, options);
  }

  stopNative(): void {
    this.player.stop();
  }

  clear(): void {
    this.streams.clear();
    this.notify();
  }
}
