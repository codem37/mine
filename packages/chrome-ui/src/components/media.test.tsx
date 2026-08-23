import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MediaStream } from "@mine/contracts";
import { MediaIndicator } from "./MediaIndicator.js";
import { PiPPlayer } from "./PiPPlayer.js";

function makeStream(overrides: Partial<MediaStream> = {}): MediaStream {
  return {
    id: "stream-1",
    url: "https://example.com/playlist.m3u8",
    mimeType: "application/x-mpegurl",
    format: "hls",
    title: "Sample Live HLS Stream",
    isDrmProtected: false,
    ...overrides,
  };
}

describe("MediaIndicator component", () => {
  it("renders null when streams array is empty", () => {
    const html = renderToStaticMarkup(<MediaIndicator streams={[]} onOpenPiP={() => {}} />);
    expect(html).toBe("");
  });

  it("renders media count badge when stream is detected", () => {
    const stream = makeStream();
    const html = renderToStaticMarkup(<MediaIndicator streams={[stream]} onOpenPiP={() => {}} />);
    expect(html).toContain("🎬 1");
  });

  it("renders lock icon badge when stream is DRM protected", () => {
    const stream = makeStream({ isDrmProtected: true });
    const html = renderToStaticMarkup(<MediaIndicator streams={[stream]} onOpenPiP={() => {}} />);
    expect(html).toContain("🔒");
  });
});

describe("PiPPlayer component", () => {
  it("renders player overlay with controls and title", () => {
    const stream = makeStream();
    const html = renderToStaticMarkup(<PiPPlayer streams={[stream]} onClose={() => {}} />);
    expect(html).toContain("Sample Live HLS Stream");
    expect(html).toContain("▶ Play");
    expect(html).toContain("▶ Handoff to Native Player (MPV)");
  });

  it("renders DRM warning badge for DRM protected streams", () => {
    const stream = makeStream({ isDrmProtected: true });
    const html = renderToStaticMarkup(<PiPPlayer streams={[stream]} onClose={() => {}} />);
    expect(html).toContain("🔒 DRM Protected Stream");
    expect(html).not.toContain("Handoff to Native Player");
  });
});
