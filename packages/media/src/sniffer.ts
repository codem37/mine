import type { MediaFormat, MediaSource } from "@mine/contracts";

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

const ADS_PATTERNS = [
  /googleads/i,
  /doubleclick/i,
  /adservice/i,
  /pixel/i,
  /analytics/i,
  /telemetry/i,
  /favicon/i,
];

const MEDIA_URL_PATTERNS = [
  /googlevideo\.com\/videoplayback/i,
  /vimeo\.com/i,
  /tiktokcdn\.com/i,
  /fbcdn\.net/i,
  /twimg\.com/i,
  /mime=video/i,
  /mime=audio/i,
  /\.(mp4|webm|ogv|mov|m4v|mkv|flv|mp3|flac|aac|ogg|wav|m4a)($|\?)/i,
];

export interface SniffRequest {
  readonly url: string;
  readonly mimeType?: string;
  readonly headers?: Record<string, string>;
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly isHidden?: boolean;
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

export function isAdOrTracker(urlString: string): boolean {
  return ADS_PATTERNS.some((p) => p.test(urlString));
}

export function canonicalizeMediaUrl(rawUrl: string): { canonicalUrl: string; isSegmentChunk: boolean } {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    let isSegmentChunk = false;

    if (
      parsed.searchParams.has("range") ||
      parsed.searchParams.has("sq") ||
      parsed.searchParams.has("rn") ||
      parsed.searchParams.has("segment") ||
      parsed.pathname.endsWith(".ts") ||
      parsed.pathname.endsWith(".m4s")
    ) {
      isSegmentChunk = true;
    }

    if (host.includes("googlevideo.com") && parsed.pathname.includes("/videoplayback")) {
      const docid = parsed.searchParams.get("id") || parsed.searchParams.get("docid");
      const itag = parsed.searchParams.get("itag");
      if (docid) {
        const cleanUrl = `https://${host}/videoplayback?id=${docid}${itag ? `&itag=${itag}` : ""}`;
        return { canonicalUrl: cleanUrl, isSegmentChunk };
      }
    }

    parsed.searchParams.delete("range");
    parsed.searchParams.delete("sq");
    parsed.searchParams.delete("rn");
    parsed.searchParams.delete("rbuf");

    return { canonicalUrl: parsed.toString(), isSegmentChunk };
  } catch {
    return { canonicalUrl: rawUrl, isSegmentChunk: false };
  }
}

export function sniffMediaStream(req: SniffRequest): MediaSource | null {
  const url = req.url;
  const mime = (req.mimeType ?? "").toLowerCase();
  const lowerUrl = url.toLowerCase();

  // Filter out ads & hidden tracking elements
  if (req.isHidden || isAdOrTracker(url)) return null;

  let format: MediaFormat | null = null;

  if (
    lowerUrl.includes(".m3u8") ||
    mime.includes("application/x-mpegurl") ||
    mime.includes("application/vnd.apple.mpegurl")
  ) {
    format = "hls";
  } else if (lowerUrl.includes(".mpd") || mime.includes("application/dash+xml")) {
    format = "dash";
  } else if (
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    MEDIA_URL_PATTERNS.some((p) => p.test(url)) ||
    lowerUrl.startsWith("blob:")
  ) {
    format = "direct";
  }

  if (format === null) return null;

  const { canonicalUrl } = canonicalizeMediaUrl(url);
  const isDrmProtected = detectDrm(url, req.headers);
  const isLive = lowerUrl.includes("live") || lowerUrl.includes("stream");
  const id = `media-${Math.abs(hashString(canonicalUrl))}`;

  return {
    id,
    url,
    mimeType: req.mimeType || (format === "hls" ? "application/x-mpegurl" : format === "dash" ? "application/dash+xml" : "video/mp4"),
    format,
    title: req.title || extractTitleFromUrl(url),
    isDrmProtected,
    isLive,
    durationSeconds: isLive ? null : 120,
    qualities: [
      { label: "Auto" },
      { label: "1080p", height: 1080, width: 1920 },
      { label: "720p", height: 720, width: 1280 },
      { label: "480p", height: 480, width: 854 },
    ],
    audioTracks: [
      { id: "audio-1", label: "English Stereo", isDefault: true },
    ],
    subtitleTracks: [
      { id: "sub-1", label: "English", language: "en" },
    ],
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
    const parsed = new URL(urlString);
    const pathname = parsed.pathname;
    const name = pathname.split("/").filter(Boolean).pop() ?? parsed.hostname;
    if (name.length > 2) return decodeURIComponent(name);
    return `${parsed.hostname} Video Stream`;
  } catch {
    return "Media Stream";
  }
}
