import { describe, expect, it } from "vitest";
import { MediaQueueManager } from "./queue.js";
import { MediaHistoryStore } from "./history.js";
import type { MediaSource } from "@mine/contracts";

const mockSource: MediaSource = {
  id: "test-1",
  url: "https://example.com/video.mp4?token=secret123",
  mimeType: "video/mp4",
  format: "direct",
  title: "Test Video",
  isDrmProtected: false,
  isLive: false,
  qualities: [],
  audioTracks: [],
  subtitleTracks: [],
};

describe("MediaQueueManager", () => {
  it("adds and advances through queue", () => {
    const q = new MediaQueueManager();
    const item1 = q.add(mockSource);
    const item2 = q.add({ ...mockSource, id: "test-2", title: "Video 2" });

    expect(q.getQueue().length).toBe(2);
    expect(q.getCurrentItem()?.id).toBe(item1.id);

    const nextItem = q.next();
    expect(nextItem?.id).toBe(item2.id);
  });

  it("handles repeat all mode", () => {
    const q = new MediaQueueManager();
    q.add(mockSource);
    q.setRepeatMode("all");
    expect(q.next()?.source.id).toBe("test-1");
  });

  it("clears queue", () => {
    const q = new MediaQueueManager();
    q.add(mockSource);
    q.clear();
    expect(q.getQueue().length).toBe(0);
  });
});

describe("MediaHistoryStore", () => {
  it("adds items and redacts sensitive query tokens", () => {
    const h = new MediaHistoryStore();
    h.add(mockSource, "example.com");

    const history = h.getHistory();
    expect(history.length).toBe(1);
    expect(history[0]?.domain).toBe("example.com");
    expect(history[0]?.url).toBe("https://example.com/video.mp4");
    expect(history[0]?.url).not.toContain("secret123");
  });

  it("clears history", () => {
    const h = new MediaHistoryStore();
    h.add(mockSource);
    h.clear();
    expect(h.getHistory().length).toBe(0);
  });
});
