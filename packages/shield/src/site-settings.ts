/**
 * SiteSettingsStore — in-memory per-domain Shield configuration.
 * Stores ad/tracker/cosmetic/allowlist settings for each hostname.
 * Never persisted to disk by default (reset on restart).
 * No URLs, cookies, or credentials are stored here.
 */

export interface SiteShieldSettings {
  readonly adsBlocked: boolean;
  readonly trackersBlocked: boolean;
  readonly cosmeticsEnabled: boolean;
  readonly allowlisted: boolean;
}

export interface PartialSiteShieldSettings {
  readonly adsBlocked?: boolean;
  readonly trackersBlocked?: boolean;
  readonly cosmeticsEnabled?: boolean;
  readonly allowlisted?: boolean;
}

const DEFAULT_SETTINGS: SiteShieldSettings = {
  adsBlocked: true,
  trackersBlocked: true,
  cosmeticsEnabled: true,
  allowlisted: false,
};

export class SiteSettingsStore {
  readonly #store = new Map<string, SiteShieldSettings>();

  /**
   * Returns the shield settings for a domain.
   * Falls back to secure defaults (all blocking on) for unknown domains.
   */
  get(domain: string): SiteShieldSettings {
    return this.#store.get(this.#normalize(domain)) ?? DEFAULT_SETTINGS;
  }

  /**
   * Merges partial settings for a domain (unspecified fields keep their current value).
   */
  set(domain: string, partial: PartialSiteShieldSettings): void {
    const key = this.#normalize(domain);
    const current = this.#store.get(key) ?? DEFAULT_SETTINGS;
    this.#store.set(key, {
      adsBlocked: partial.adsBlocked ?? current.adsBlocked,
      trackersBlocked: partial.trackersBlocked ?? current.trackersBlocked,
      cosmeticsEnabled: partial.cosmeticsEnabled ?? current.cosmeticsEnabled,
      allowlisted: partial.allowlisted ?? current.allowlisted,
    });
  }

  /**
   * Returns true if the domain is on the Shield allowlist (Shield disabled for that site).
   */
  isAllowlisted(domain: string): boolean {
    return this.get(domain).allowlisted;
  }

  /**
   * Returns true if Shield is effectively active for this domain
   * (not allowlisted, and at least one blocking category is on).
   */
  isActive(domain: string): boolean {
    const s = this.get(domain);
    return !s.allowlisted && (s.adsBlocked || s.trackersBlocked || s.cosmeticsEnabled);
  }

  /**
   * Resets a domain to default settings.
   */
  reset(domain: string): void {
    this.#store.delete(this.#normalize(domain));
  }

  /** All explicitly configured domains. */
  configuredDomains(): string[] {
    return [...this.#store.keys()];
  }

  #normalize(domain: string): string {
    // Strip leading "www." for consistent keying
    return domain.toLowerCase().replace(/^www\./, "");
  }
}
