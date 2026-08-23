import { describe, expect, it, vi } from "vitest";
import { MediaEngine } from "./engine.js";

describe("MediaEngine", () => {
  it("inspects requests and notifies listeners when stream detected", () => {
    const engine = new MediaEngine();
    const listener = vi.fn();
    engine.onStreamDetected(listener);

    const source = engine.inspectRequest({ url: "https://example.com/live.m3u8" });
    expect(source).not.toBeNull();
    expect(engine.getSources()).toHaveLength(1);
    expect(listener).toHaveBeenCalledWith([source]);
  });

  it("handles player controls: seek, volume, speed, frame step, A-B loop", () => {
    const engine = new MediaEngine();
    engine.playNative("https://example.com/video.mp4");

    engine.controlPlayer("seek", 45);
    expect(engine.getPlayerState().currentTime).toBe(45);

    engine.controlPlayer("setSpeed", 1.5);
    expect(engine.getPlayerState().playbackRate).toBe(1.5);

    engine.controlPlayer("setABLoop", [10, 30]);
    expect(engine.getPlayerState().loopState).toBe("range");
    expect(engine.getPlayerState().loopRange).toEqual([10, 30]);

    engine.controlPlayer("stepFrame", true);
    expect(engine.getPlayerState().status).toBe("paused");
  });

  it("creates download handoff request for Phase 4 Fetcher", () => {
    const engine = new MediaEngine();
    const source = engine.inspectRequest({ url: "https://example.com/clip.mp4", title: "Test Clip" });
    expect(source).not.toBeNull();

    const req = engine.createDownloadRequest(source!.id, "1080p");
    expect(req).toEqual({
      sourceId: source!.id,
      url: "https://example.com/clip.mp4",
      title: "Test Clip",
      quality: "1080p",
      format: "direct",
    });
  });
});
