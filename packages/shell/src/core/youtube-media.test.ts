import { describe, expect, it } from "vitest";
import { isYouTubeMediaStream } from "../shield-bridge.js";

describe("isYouTubeMediaStream matcher regression tests", () => {
  it("allows signed googlevideo.com/videoplayback media requests initiated by YouTube", () => {
    const mediaUrl = "https://rr2---sn-ab5szn7d.googlevideo.com/videoplayback?expire=1787521200&ei=sample&ip=127.0.0.1&id=abc123";
    const sourceUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    expect(isYouTubeMediaStream(mediaUrl, sourceUrl, "media")).toBe(true);
    expect(isYouTubeMediaStream(mediaUrl, sourceUrl, "xmlhttprequest")).toBe(false);
  });

  it("requires a verified YouTube initiator", () => {
    const mediaUrl = "https://rr5---sn-4g5ednsl.googlevideo.com/videoplayback?expire=1787521200";
    expect(isYouTubeMediaStream(mediaUrl, "", "media")).toBe(false);
    expect(isYouTubeMediaStream(mediaUrl, "https://www.youtube-nocookie.com/embed/abc", "media")).toBe(true);
  });

  it("rejects non-videoplayback requests on googlevideo.com", () => {
    const trackingUrl = "https://rr2---sn-ab5szn7d.googlevideo.com/initplayback?expire=1787521200";
    expect(isYouTubeMediaStream(trackingUrl, "https://www.youtube.com/", "media")).toBe(false);
  });

  it("rejects actual ad URLs on doubleclick or googleads", () => {
    const adUrl = "https://googleads.g.doubleclick.net/pagead/id";
    expect(isYouTubeMediaStream(adUrl, "https://www.youtube.com/", "script")).toBe(false);
  });

  it("rejects non-media resource types", () => {
    const scriptUrl = "https://rr2---sn-ab5szn7d.googlevideo.com/videoplayback";
    expect(isYouTubeMediaStream(scriptUrl, "https://www.youtube.com/", "script")).toBe(false);
  });
});
