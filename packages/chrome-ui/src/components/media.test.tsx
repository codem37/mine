import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MediaSource } from "@mine/contracts";
import { MediaIndicator } from "./MediaIndicator.js";
import { MediaActionBubble } from "./MediaActionBubble.js";
import { CinematicPlayer } from "./CinematicPlayer.js";

function makeSource(overrides: Partial<MediaSource> = {}): MediaSource {
  return {
    id: "media-1",
    url: "https://example.com/playlist.m3u8",
    mimeType: "application/x-mpegurl",
    format: "hls",
    title: "Sample Live HLS Stream",
    isDrmProtected: false,
    isLive: true,
    qualities: [{ label: "Auto" }, { label: "1080p" }],
    audioTracks: [{ id: "a1", label: "English" }],
    subtitleTracks: [{ id: "s1", label: "English" }],
    ...overrides,
  };
}

describe("MediaIndicator component", () => {
  it("renders null when sources array is empty", () => {
    const html = renderToStaticMarkup(<MediaIndicator sources={[]} onOpenBubble={() => {}} />);
    expect(html).toBe("");
  });

  it("renders media count badge when sources are detected", () => {
    const s1 = makeSource();
    const s2 = makeSource({ id: "media-2", title: "Second Stream" });
    const html = renderToStaticMarkup(<MediaIndicator sources={[s1, s2]} onOpenBubble={() => {}} />);
    expect(html).toContain("2");
  });
});

describe("MediaActionBubble component", () => {
  it("renders vertical capsule options for playing, opening in player, and downloading", () => {
    const s1 = makeSource();
    const html = renderToStaticMarkup(<MediaActionBubble sources={[s1]} onClose={() => {}} onOpenPlayer={() => {}} />);
    expect(html).toContain("Play in Native Player");
    expect(html).toContain("Download via Fetcher");
  });

  it("displays DRM notice for protected media", () => {
    const s1 = makeSource({ isDrmProtected: true });
    const html = renderToStaticMarkup(<MediaActionBubble sources={[s1]} onClose={() => {}} onOpenPlayer={() => {}} />);
    expect(html).toContain("🔒 DRM Protected Media");
  });
});

describe("CinematicPlayer component", () => {
  it("renders cinematic header, timeline, and controls", () => {
    const s1 = makeSource();
    const html = renderToStaticMarkup(<CinematicPlayer source={s1} onClose={() => {}} />);
    expect(html).toContain("Sample Live HLS Stream");
    expect(html).toContain("A-B Loop");
    expect(html).toContain("↓ Download");
  });

  it("renders resume prompt when playbackPosition is set", () => {
    const s1 = makeSource({ playbackPosition: 120 });
    const html = renderToStaticMarkup(<CinematicPlayer source={s1} onClose={() => {}} />);
    expect(html).toContain("Resume from 02:00?");
  });
});
