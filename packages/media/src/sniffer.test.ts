import { describe, expect, it } from "vitest";
import { sniffMediaStream, detectDrm } from "./sniffer.js";

describe("MediaSniffer", () => {
  it("detects HLS stream (.m3u8)", () => {
    const stream = sniffMediaStream({ url: "https://example.com/live/playlist.m3u8" });
    expect(stream).not.toBeNull();
    expect(stream?.format).toBe("hls");
    expect(stream?.isDrmProtected).toBe(false);
  });

  it("detects DASH stream (.mpd)", () => {
    const stream = sniffMediaStream({ url: "https://example.com/video/manifest.mpd" });
    expect(stream).not.toBeNull();
    expect(stream?.format).toBe("dash");
  });

  it("detects direct MP4 media", () => {
    const stream = sniffMediaStream({ url: "https://example.com/clip.mp4", mimeType: "video/mp4" });
    expect(stream).not.toBeNull();
    expect(stream?.format).toBe("direct");
  });

  it("detects Widevine DRM protection and flags stream as DRM protected", () => {
    const isDrm = detectDrm("https://license.widevine.com/cenc/getlicense");
    expect(isDrm).toBe(true);

    const stream = sniffMediaStream({
      url: "https://example.com/stream.mpd?widevine=true",
      headers: { "x-drm-type": "com.widevine.alpha" },
    });
    expect(stream).not.toBeNull();
    expect(stream?.isDrmProtected).toBe(true);
  });
});
