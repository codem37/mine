export type ThreatCategory =
  | "phishing"
  | "malware"
  | "scam"
  | "lookalike"
  | "deceptive"
  | "dangerous-download"
  | "malicious-redirect"
  | "suspicious-resource"
  | "certificate"
  | "connection"
  | "unknown";

export type SafetySeverity = 0 | 1 | 2 | 3 | 4; // 0=Safe, 1=Info, 2=Suspicious, 3=Dangerous, 4=Blocked

export type SafetyState =
  | "safe"
  | "informational"
  | "suspicious"
  | "dangerous"
  | "blocked"
  | "unknown"
  | "database-stale"
  | "database-unavailable";

export type SafetyAction = "allow" | "warn" | "block" | "quarantine";

export interface SecurityVerdict {
  readonly state: SafetyState;
  readonly category: ThreatCategory;
  readonly severity: SafetySeverity;
  readonly source: string; // e.g. "Safe Browsing", "OpenPhish", "URLhaus", "Local heuristic"
  readonly reason?: string;
  readonly url: string;
  readonly timestamp: number;
  readonly action: SafetyAction;
  readonly expires?: number;
  readonly intendedUrl?: string; // For look-alike domain suggestions
}

export interface PrivacyStats {
  readonly adsBlocked: number;
  readonly trackersBlocked: number;
}

export interface SafetyStats {
  readonly state: SafetyState;
  readonly threatsBlocked: number;
  readonly suspiciousSites: number;
  readonly dangerousDownloads: number;
}

export interface DatabaseStatus {
  readonly status: "current" | "updating" | "stale" | "offline";
  readonly lastUpdated: number;
}

export interface ProtectionCenterStats {
  readonly privacy: PrivacyStats;
  readonly safety: SafetyStats;
  readonly dbStatus: DatabaseStatus;
  readonly activePermissionsCount: number;
}

export interface SecurityEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly threatType: ThreatCategory;
  readonly url: string;
  readonly domain: string;
  readonly action: SafetyAction;
  readonly source: string;
}

export interface AddExceptionRequest {
  readonly domain: string;
  readonly durationMinutes?: number; // Default 15 mins for temporary exception, undefined for permanent
}
