import type { ProtectionCenterStats, SecurityEvent, SecurityVerdict } from "@mine/contracts";
import { ThreatDatabase } from "./db.js";
import { checkLookalikeDomain, checkDeceptiveScam } from "./heuristics.js";
import { ExceptionManager } from "./manager.js";

export class SafetyEngine {
  private readonly db = new ThreatDatabase();
  private readonly exceptionMgr = new ExceptionManager();
  private readonly events: SecurityEvent[] = [];
  private threatsBlockedCount = 0;
  private suspiciousSitesCount = 0;
  private dangerousDownloadsCount = 0;

  addException(domain: string, durationMinutes?: number): void {
    this.exceptionMgr.addException(domain, durationMinutes);
  }

  removeException(domain: string): void {
    this.exceptionMgr.removeException(domain);
  }

  getEvents(): readonly SecurityEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events.length = 0;
  }

  evaluateUrl(urlString: string, pageContent?: string): SecurityVerdict {
    const timestamp = Date.now();
    let hostname = "web";
    try {
      hostname = new URL(urlString).hostname;
    } catch {
      // default
    }

    // Check Allowlist / Exception
    if (this.exceptionMgr.isException(hostname)) {
      return {
        state: "safe",
        category: "unknown",
        severity: 0,
        source: "User Exception",
        url: urlString,
        timestamp,
        action: "allow",
      };
    }

    // 1. Threat Database Lookup (Phishing / Malware / Scam)
    const dbMatch = this.db.lookup(hostname);
    if (dbMatch) {
      this.threatsBlockedCount += 1;
      const verdict: SecurityVerdict = {
        state: dbMatch.category === "scam" ? "suspicious" : "blocked",
        category: dbMatch.category,
        severity: dbMatch.category === "scam" ? 2 : 4,
        source: dbMatch.source,
        reason: dbMatch.reason,
        url: urlString,
        timestamp,
        action: dbMatch.category === "scam" ? "warn" : "block",
      };
      this.logEvent(verdict, hostname);
      return verdict;
    }

    // 2. Look-alike Domain Heuristic
    const lookalike = checkLookalikeDomain(hostname);
    if (lookalike.isLookalike) {
      this.suspiciousSitesCount += 1;
      const verdict: SecurityVerdict = {
        state: "suspicious",
        category: "lookalike",
        severity: 2,
        source: "Local Heuristic",
        reason: "Possible domain impersonation",
        url: urlString,
        timestamp,
        action: "warn",
        intendedUrl: lookalike.intendedUrl,
      };
      this.logEvent(verdict, hostname);
      return verdict;
    }

    // 3. Deceptive Scam Content Heuristic
    if (checkDeceptiveScam(urlString, pageContent)) {
      this.suspiciousSitesCount += 1;
      const verdict: SecurityVerdict = {
        state: "suspicious",
        category: "deceptive",
        severity: 2,
        source: "Local Heuristic",
        reason: "Deceptive fake support scam warning",
        url: urlString,
        timestamp,
        action: "warn",
      };
      this.logEvent(verdict, hostname);
      return verdict;
    }

    return {
      state: "safe",
      category: "unknown",
      severity: 0,
      source: "Safety Engine",
      url: urlString,
      timestamp,
      action: "allow",
    };
  }

  evaluateDownload(urlString: string): SecurityVerdict {
    const verdict = this.evaluateUrl(urlString);
    if (verdict.state === "blocked" || verdict.state === "dangerous") {
      this.dangerousDownloadsCount += 1;
      return {
        ...verdict,
        category: "dangerous-download",
        reason: "Known malicious download source",
      };
    }
    return verdict;
  }

  getProtectionCenterStats(adsBlocked = 0, trackersBlocked = 0): ProtectionCenterStats {
    return {
      privacy: {
        adsBlocked,
        trackersBlocked,
      },
      safety: {
        state: this.threatsBlockedCount > 0 ? "blocked" : this.suspiciousSitesCount > 0 ? "suspicious" : "safe",
        threatsBlocked: this.threatsBlockedCount,
        suspiciousSites: this.suspiciousSitesCount,
        dangerousDownloads: this.dangerousDownloadsCount,
      },
      dbStatus: {
        status: this.db.getFreshnessStatus(),
        lastUpdated: this.db.getLastUpdated(),
      },
      activePermissionsCount: 3,
    };
  }

  private logEvent(verdict: SecurityVerdict, domain: string): void {
    this.events.unshift({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: verdict.timestamp,
      threatType: verdict.category,
      url: verdict.url,
      domain,
      action: verdict.action,
      source: verdict.source,
    });
    if (this.events.length > 50) this.events.pop();
  }
}
