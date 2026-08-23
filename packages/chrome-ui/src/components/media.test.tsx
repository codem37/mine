import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MediaSource } from "@mine/contracts";
import { MediaIndicator } from "./MediaIndicator.js";
import { MediaActionBubble } from "./MediaActionBubble.js";
import { CinematicPlayer } from "./CinematicPlayer.js";
import { MediaDetectionIndicator } from "./MediaDetectionIndicator.js";
import { MediaQueueModal } from "./MediaQueueModal.js";
import { MediaHistoryModal } from "./MediaHistoryModal.js";

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
  it("renders idle symbol ○ when sources array is empty", () => {
    const html = renderToStaticMarkup(<MediaIndicator sources={[]} onOpenBubble={() => {}} />);
    expect(html).toContain("○");
  });

  it("renders media count badge ● 2 when multiple sources are detected", () => {
    const s1 = makeSource();
    const s2 = makeSource({ id: "media-2", title: "Second Stream" });
    const html = renderToStaticMarkup(<MediaIndicator sources={[s1, s2]} onOpenBubble={() => {}} />);
    expect(html).toContain("● 2");
  });

  it("renders playing symbol ▶ when media is actively playing", () => {
    const s1 = makeSource();
    const html = renderToStaticMarkup(<MediaIndicator sources={[s1]} onOpenBubble={() => {}} isPlaying />);
    expect(html).toContain("▶");
  });
});

describe("MediaDetectionIndicator component", () => {
  it("renders floating toast capsule with title, Play and Download buttons", () => {
    const s1 = makeSource();
    const html = renderToStaticMarkup(
      <MediaDetectionIndicator source={s1} onOpenPlayer={() => {}} onDownload={() => {}} onClose={() => {}} />,
    );
    expect(html).toContain("Sample Live HLS Stream");
    expect(html).toContain("▶ Play");
    expect(html).toContain("↓ Download");
  });
});

describe("MediaActionBubble component", () => {
  it("renders options for playing and downloading", () => {
    const s1 = makeSource();
    const html = renderToStaticMarkup(<MediaActionBubble sources={[s1]} onClose={() => {}} onOpenPlayer={() => {}} />);
    expect(html).toContain("Play in Native Player");
    expect(html).toContain("Download via Fetcher");
  });
});

describe("CinematicPlayer component", () => {
  it("renders cinematic header, controls, speed selector, and download button", () => {
    const s1 = makeSource();
    const html = renderToStaticMarkup(<CinematicPlayer source={s1} onClose={() => {}} />);
    expect(html).toContain("Sample Live HLS Stream");
    expect(html).toContain("↓ Download");
    expect(html).toContain("Speed:");
    expect(html).toContain("🎛 EQ");
    expect(html).toContain("📐 Mode");
  });
});

describe("MediaQueueModal component", () => {
  it("renders Media Queue title and empty state", () => {
    const html = renderToStaticMarkup(<MediaQueueModal onClose={() => {}} onPlayItem={() => {}} />);
    expect(html).toContain("Media Queue");
  });
});

describe("MediaHistoryModal component", () => {
  it("renders Recently Played History title", () => {
    const html = renderToStaticMarkup(<MediaHistoryModal onClose={() => {}} />);
    expect(html).toContain("Recently Played History");
  });
});
