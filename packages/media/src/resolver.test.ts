import { describe, expect, it } from "vitest";
import { parseHlsManifest } from "./resolver.js";

describe("MediaResolver HLS parser", () => {
  it("parses variant stream resolutions and media tracks", () => {
    const manifest = `
#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English Stereo",LANGUAGE="en"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en"
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
chunk-1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
chunk-720p.m3u8
    `.trim();

    const { qualities, audioTracks, subtitleTracks } = parseHlsManifest(manifest);

    expect(qualities).toContainEqual({ label: "1080p", width: 1920, height: 1080, bitrateBps: 5000000 });
    expect(qualities).toContainEqual({ label: "720p", width: 1280, height: 720, bitrateBps: 2500000 });
    expect(audioTracks[0]?.label).toBe("English Stereo");
    expect(subtitleTracks[0]?.label).toBe("English");
  });
});
