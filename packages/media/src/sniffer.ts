import type { MediaFormat, MediaStream } from "@mine/contracts";

const DRM_PATTERNS = [
  /widevine/i,
  /com\.widevine\.alpha/i,
  /fairplay/i,
  /com\.apple\.fps/i,
  /playready/i,
  /clearkey/i,
  /license\.php/i,
  /license_server/i,
];

export interface SniffRequest {
  readonly url: string;
  readonly mimeType?: string;
  readonly headers?: Record<string, string>;
  readonly title?: string;
}

export function detectDrm(urlString: string, headers?: Record<string, string>): boolean {
  if (DRM_PATTERNS.some((p) => p.test(urlString))) return true;
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (DRM_PATTERNS.some((p) => p.test(k) || p.test(v))) return true;
    }
  }
  return false;
}

export function sniffMediaStream(req: SniffRequest): MediaStream | null {
  const url = req.url;
  const mime = (req.mimeType ?? "").toLowerCase();
  const lowerUrl = url.toLowerCase();

  let format: MediaFormat | null = null;

  if (lowerUrl.includes(".m3u8") || mime.includes("application/x-mpegurl") || mime.includes("application/vnd.apple.mpegurl")) {
    format = "hls";
  } else if (lowerUrl.includes(".mpd") || mime.includes("application/dash+xml")) {
    format = "dash";
  } else if (
    lowerUrl.match(/\.(mp4|webm|ogv|mov|mp3|flac|aac|ogg)($|\?)/i) ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/")
  ) {
    format = "direct";
  }

  if (format === null) return null;

  const isDrmProtected = detectDrm(url, req.headers);

  // Simple clean ID generation
  const id = `stream-${Math.abs(hashString(url))}`;

  return {
    id,
    url,
    mimeType: req.mimeType || (format === "hls" ? "application/x-mpegurl" : format === "dash" ? "application/dash+xml" : "video/mp4"),
    format,
    title: req.title || extractTitleFromUrl(url),
    isDrmProtected,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function extractTitleFromUrl(urlString: string): string {
  try {
    const pathname = new URL(urlString).pathname;
    const name = pathname.split("/").pop() ?? "media stream";
    return decodeURIComponent(name);
  } catch {
    return "media stream";
  }
}
