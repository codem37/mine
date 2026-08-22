const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "msclkid",
  "dclid",
  "twclid",
  "mc_eid",
  "igshid",
]);

export function stripTrackingParams(urlString: string): string {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return urlString;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return urlString;
  }
  let removed = false;
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
      removed = true;
    }
  }
  if (!removed) {
    return urlString;
  }
  const result = url.toString();
  return result.endsWith("?") ? result.slice(0, -1) : result;
}
