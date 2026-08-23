import type { SecurityVerdict, ThreatCategory } from "@mine/contracts";

const THREAT_DB: Record<string, { category: ThreatCategory; source: string; reason: string }> = {
  "phishing.test": { category: "phishing", source: "OpenPhish", reason: "Known credential phishing domain" },
  "malware.test": { category: "malware", source: "URLhaus", reason: "Distributes malicious binary payload" },
  "scam.test": { category: "scam", source: "Safe Browsing", reason: "Fake support scam hotline page" },
};

export class ThreatDatabase {
  private lastUpdated = Date.now();
  private isStale = false;

  lookup(hostname: string): { category: ThreatCategory; source: string; reason: string } | null {
    const lower = hostname.toLowerCase();
    for (const [pattern, entry] of Object.entries(THREAT_DB)) {
      if (lower.endsWith(pattern)) {
        return entry;
      }
    }
    return null;
  }

  getFreshnessStatus(): "current" | "stale" {
    return this.isStale ? "stale" : "current";
  }

  getLastUpdated(): number {
    return this.lastUpdated;
  }
}
