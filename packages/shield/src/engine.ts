import type { RequestVerdict, ShieldEngineState } from "@mine/contracts";
import { SHIELD_ENGINE_STATES } from "@mine/contracts";

export interface NativeEngineLike {
  replaceFilters(lists: string[]): void;
  check(
    url: string,
    sourceUrl: string,
    resourceType: string,
  ): { blocked: boolean; matchedFilter: string | null };
  /** Optional: CSS selectors to hide for a page URL */
  getCosmeticSelectors?(pageUrl: string): string[];
  /** Optional: full CSS string ready to inject */
  getCosmeticCSS?(pageUrl: string): string;
}

export class ShieldEngine {
  #native: NativeEngineLike | null = null;
  #state: ShieldEngineState = "uninitialised";
  #lastError: string | null = null;
  #enabled = true;
  readonly #allowlist = new Set<string>();
  readonly #listeners = new Set<(state: ShieldEngineState) => void>();

  get state(): ShieldEngineState {
    return this.#state;
  }

  get hasNative(): boolean {
    return this.#native !== null;
  }

  get lastError(): string | null {
    return this.#lastError;
  }

  get enabled(): boolean {
    return this.#enabled;
  }

  get allowlist(): readonly string[] {
    return Array.from(this.#allowlist);
  }

  allowSite(hostnameOrDomain: string): void {
    if (hostnameOrDomain) {
      this.#allowlist.add(hostnameOrDomain.toLowerCase());
    }
  }

  disallowSite(hostnameOrDomain: string): void {
    if (hostnameOrDomain) {
      this.#allowlist.delete(hostnameOrDomain.toLowerCase());
    }
  }

  isSiteAllowed(sourceUrl: string): boolean {
    if (this.#allowlist.size === 0 || !sourceUrl) return false;
    try {
      const host = new URL(sourceUrl).hostname.toLowerCase();
      for (const domain of this.#allowlist) {
        if (host === domain || host.endsWith(`.${domain}`)) return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  onStateChange(listener: (state: ShieldEngineState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  attachNative(native: NativeEngineLike): void {
    this.#native = native;
  }

  setEnabled(value: boolean): void {
    this.#enabled = value;
  }

  async loadLists(fetchLists: () => Promise<string[]>): Promise<void> {
    if (this.#native === null) {
      this.#lastError = "no native engine attached";
      this.#setState("failed");
      return;
    }
    this.#setState("loading");
    try {
      const lists = await fetchLists();
      const totalRules = lists.reduce((n, l) => n + l.length, 0);
      if (lists.length === 0 || totalRules === 0) {
        throw new Error("filter sources produced no data");
      }
      this.#native.replaceFilters(lists);
      this.#setState("ready");
      this.#lastError = null;
    } catch (error) {
      this.#lastError =
        error instanceof Error ? error.message : String(error);
      this.#setState("failed");
    }
  }

  checkRequest(
    url: string,
    sourceUrl: string,
    resourceType: string,
  ): RequestVerdict {
    // Disabled or allowlisted site short-circuits evaluation
    if (!this.#enabled || this.isSiteAllowed(sourceUrl)) {
      return { blocked: false, matchedFilter: null };
    }
    if (this.#state !== "ready" || this.#native === null) {
      return { blocked: false, matchedFilter: null };
    }
    try {
      const verdict = this.#native.check(url, sourceUrl, resourceType);
      return {
        blocked: verdict.blocked,
        matchedFilter: verdict.matchedFilter ?? null,
      };
    } catch {
      return { blocked: false, matchedFilter: null };
    }
  }

  /**
   * Returns CSS ready to inject as element-hiding rules for pageUrl.
   * Returns empty string if Shield is disabled, engine not ready, or no rules match.
   * Never logs URL details.
   */
  getCosmeticCSS(pageUrl: string): string {
    if (!this.#enabled || this.#state !== "ready" || this.#native === null) return "";
    try {
      return this.#native.getCosmeticCSS?.(pageUrl) ?? "";
    } catch {
      return "";
    }
  }

  /**
   * Returns an array of CSS selector strings for element hiding on pageUrl.
   */
  getCosmeticSelectors(pageUrl: string): string[] {
    if (!this.#enabled || this.#state !== "ready" || this.#native === null) return [];
    try {
      return this.#native.getCosmeticSelectors?.(pageUrl) ?? [];
    } catch {
      return [];
    }
  }

  #setState(state: ShieldEngineState): void {
    if (!SHIELD_ENGINE_STATES.includes(state)) {
      throw new Error(`unknown engine state: ${state}`);
    }
    this.#state = state;
    for (const listener of this.#listeners) {
      listener(state);
    }
  }
}
