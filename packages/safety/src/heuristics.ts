const KNOWN_DOMAINS: Record<string, string> = {
  "paypal.com": "paypal.com",
  "google.com": "google.com",
  "facebook.com": "facebook.com",
  "amazon.com": "amazon.com",
  "github.com": "github.com",
};

export function checkLookalikeDomain(hostname: string): { isLookalike: boolean; intendedUrl?: string } {
  const lower = hostname.toLowerCase();
  // Check homoglyph replacement (e.g. paypaI -> paypal)
  const normalized = lower.replace(/i/g, "l").replace(/0/g, "o").replace(/1/g, "l");

  for (const known of Object.keys(KNOWN_DOMAINS)) {
    if (lower !== known && normalized.includes(known.replace(".com", ""))) {
      return {
        isLookalike: true,
        intendedUrl: `https://${known}`,
      };
    }
  }

  return { isLookalike: false };
}

export function checkDeceptiveScam(url: string, content?: string): boolean {
  if (!content) return false;
  const lower = content.toLowerCase();
  if (lower.includes("your computer is infected") || lower.includes("call microsoft support") || lower.includes("virus detected! call immediately")) {
    return true;
  }
  return false;
}
