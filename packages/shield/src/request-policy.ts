/**
 * Narrow compatibility rules around static filters. A rule is only added after
 * a verified breakage and must be exact, contextual, and independently tested.
 */
export interface ShieldRequestContext {
  readonly url: string;
  readonly sourceUrl: string;
  readonly resourceType: string;
}

export interface RedactedRequestDiagnostic {
  readonly host: string;
  readonly pathname: string;
  readonly sourceHost: string | null;
  readonly resourceType: string;
}

export function isEssentialYouTubeMediaRequest(
  request: ShieldRequestContext,
): boolean {
  if (request.resourceType.toLowerCase() !== "media") return false;
  const target = asUrl(request.url);
  const source = asUrl(request.sourceUrl);
  if (target === null || source === null) return false;
  const targetHost = target.hostname.toLowerCase();
  const sourceHost = source.hostname.toLowerCase();
  const googleVideo = targetHost === "googlevideo.com" || targetHost.endsWith(".googlevideo.com");
  const youtube = sourceHost === "youtube.com" || sourceHost.endsWith(".youtube.com") || sourceHost === "youtube-nocookie.com" || sourceHost.endsWith(".youtube-nocookie.com");
  return googleVideo && target.pathname === "/videoplayback" && youtube;
}

export function redactRequestDiagnostic(
  request: ShieldRequestContext,
): RedactedRequestDiagnostic | null {
  const target = asUrl(request.url);
  if (target === null) return null;
  const source = asUrl(request.sourceUrl);
  return {
    host: target.hostname.toLowerCase(),
    pathname: target.pathname,
    sourceHost: source?.hostname.toLowerCase() ?? null,
    resourceType: request.resourceType.toLowerCase(),
  };
}

function asUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
