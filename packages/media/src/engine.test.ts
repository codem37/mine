import { describe, expect, it, vi } from "vitest";
import { MediaEngine } from "./engine.js";

describe("MediaEngine", () => {
  it("inspects requests and notifies listeners when stream detected", () => {
    const engine = new MediaEngine();
    const listener = vi.fn();
    engine.on(listener);

    const stream = engine.inspectRequest({ url: "https://example.com/live.m3u8" });
    expect(stream).not.toBeNull();
    expect(engine.getStreams()).toHaveLength(1);
    expect(listener).toHaveBeenCalledWith([stream]);
  });

  it("clears streams correctly", () => {
    const engine = new MediaEngine();
    engine.inspectRequest({ url: "https://example.com/video.mp4" });
    expect(engine.getStreams()).toHaveLength(1);
    engine.clear();
    expect(engine.getStreams()).toHaveLength(0);
  });
});
