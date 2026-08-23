import type { MediaQueueItem, MediaSource } from "@mine/contracts";

export type RepeatMode = "off" | "single" | "all";

export class MediaQueueManager {
  private queue: MediaQueueItem[] = [];
  private currentIndex = -1;
  private repeatMode: RepeatMode = "off";
  private isShuffle = false;

  add(source: MediaSource): MediaQueueItem {
    const item: MediaQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source,
      addedAt: Date.now(),
    };
    this.queue.push(item);
    if (this.currentIndex === -1) {
      this.currentIndex = 0;
    }
    return item;
  }

  remove(id: string): void {
    const idx = this.queue.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      if (this.currentIndex >= this.queue.length) {
        this.currentIndex = this.queue.length - 1;
      }
    }
  }

  clear(): void {
    this.queue = [];
    this.currentIndex = -1;
  }

  getQueue(): readonly MediaQueueItem[] {
    return this.queue;
  }

  getCurrentItem(): MediaQueueItem | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
      return this.queue[this.currentIndex] ?? null;
    }
    return null;
  }

  next(): MediaQueueItem | null {
    if (this.queue.length === 0) return null;
    if (this.repeatMode === "single") {
      return this.getCurrentItem();
    }
    if (this.isShuffle) {
      this.currentIndex = Math.floor(Math.random() * this.queue.length);
      return this.getCurrentItem();
    }
    if (this.currentIndex + 1 < this.queue.length) {
      this.currentIndex++;
      return this.getCurrentItem();
    }
    if (this.repeatMode === "all") {
      this.currentIndex = 0;
      return this.getCurrentItem();
    }
    return null;
  }

  previous(): MediaQueueItem | null {
    if (this.queue.length === 0) return null;
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentItem();
    }
    if (this.repeatMode === "all") {
      this.currentIndex = this.queue.length - 1;
      return this.getCurrentItem();
    }
    return this.getCurrentItem();
  }

  setRepeatMode(mode: RepeatMode): void {
    this.repeatMode = mode;
  }

  getRepeatMode(): RepeatMode {
    return this.repeatMode;
  }

  setShuffle(shuffle: boolean): void {
    this.isShuffle = shuffle;
  }

  getShuffle(): boolean {
    return this.isShuffle;
  }
}
