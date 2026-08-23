import type { MediaQuality, MediaTrack } from "@mine/contracts";

export function parseHlsManifest(content: string): { qualities: MediaQuality[]; audioTracks: MediaTrack[]; subtitleTracks: MediaTrack[] } {
  const qualities: MediaQuality[] = [{ label: "Auto" }];
  const audioTracks: MediaTrack[] = [];
  const subtitleTracks: MediaTrack[] = [];

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const resMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
      const bwMatch = line.match(/BANDWIDTH=(\d+)/);
      if (resMatch) {
        const height = Number(resMatch[2]);
        const width = Number(resMatch[1]);
        const label = `${height}p`;
        const bw = bwMatch ? Number(bwMatch[1]) : undefined;
        qualities.push({ label, width, height, bitrateBps: bw });
      }
    } else if (line.startsWith("#EXT-X-MEDIA:")) {
      if (line.includes('TYPE=AUDIO')) {
        const nameMatch = line.match(/NAME="([^"]+)"/);
        const langMatch = line.match(/LANGUAGE="([^"]+)"/);
        if (nameMatch) {
          audioTracks.push({
            id: `audio-${audioTracks.length + 1}`,
            label: nameMatch[1],
            language: langMatch ? langMatch[1] : undefined,
          });
        }
      } else if (line.includes('TYPE=SUBTITLES')) {
        const nameMatch = line.match(/NAME="([^"]+)"/);
        const langMatch = line.match(/LANGUAGE="([^"]+)"/);
        if (nameMatch) {
          subtitleTracks.push({
            id: `sub-${subtitleTracks.length + 1}`,
            label: nameMatch[1],
            language: langMatch ? langMatch[1] : undefined,
          });
        }
      }
    }
  }

  return { qualities, audioTracks, subtitleTracks };
}
