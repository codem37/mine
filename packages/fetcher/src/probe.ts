export interface ProbeResult {
  readonly url: string;
  readonly acceptsRanges: boolean;
  readonly contentLength: number;
  readonly filename: string;
  readonly etag?: string;
  readonly contentType?: string;
}

export function extractFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  // Match filename*=UTF-8''encoded_name
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  // Match filename="name" or filename=name
  const standardMatch = disposition.match(/filename=["']?([^"';]+)["']?/i);
  if (standardMatch?.[1]) {
    return standardMatch[1].trim();
  }
  return null;
}

export function extractFilenameFromUrl(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    const pathname = parsed.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.trim().length > 0) {
      return decodeURIComponent(last);
    }
  } catch {
    // fallback
  }
  return "download.bin";
}

export async function probeUrl(
  urlString: string,
  options?: { readonly headers?: Record<string, string>; readonly signal?: AbortSignal },
): Promise<ProbeResult> {
  let acceptsRanges = false;
  let contentLength = 0;
  let filename = extractFilenameFromUrl(urlString);
  let etag: string | undefined;
  let contentType: string | undefined;

  try {
    const headRes = await fetch(urlString, {
      method: "HEAD",
      headers: options?.headers,
      signal: options?.signal,
    });

    if (headRes.ok) {
      const acceptRangesHeader = headRes.headers.get("accept-ranges");
      const lengthHeader = headRes.headers.get("content-length");
      const disposition = headRes.headers.get("content-disposition");
      etag = headRes.headers.get("etag") ?? undefined;
      contentType = headRes.headers.get("content-type") ?? undefined;

      const dispFilename = extractFilenameFromDisposition(disposition);
      if (dispFilename) filename = dispFilename;

      if (lengthHeader) {
        const parsedLen = Number.parseInt(lengthHeader, 10);
        if (Number.isFinite(parsedLen) && parsedLen > 0) {
          contentLength = parsedLen;
        }
      }

      if (acceptRangesHeader && acceptRangesHeader.toLowerCase().includes("bytes") && contentLength > 0) {
        acceptsRanges = true;
      }
    } else if (headRes.status === 405 || headRes.status === 501) {
      // HEAD not supported, probe via Range GET bytes=0-0
      const rangeRes = await fetch(urlString, {
        method: "GET",
        headers: {
          ...options?.headers,
          Range: "bytes=0-0",
        },
        signal: options?.signal,
      });

      if (rangeRes.status === 206) {
        acceptsRanges = true;
        const contentRange = rangeRes.headers.get("content-range");
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)/);
          if (match?.[1]) {
            contentLength = Number.parseInt(match[1], 10);
          }
        }
      }
      const disposition = rangeRes.headers.get("content-disposition");
      const dispFilename = extractFilenameFromDisposition(disposition);
      if (dispFilename) filename = dispFilename;
    }
  } catch {
    // If probing fails, return safe single-stream default
  }

  return {
    url: urlString,
    acceptsRanges,
    contentLength,
    filename,
    etag,
    contentType,
  };
}
