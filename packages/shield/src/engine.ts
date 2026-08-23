import type { RequestVerdict, ShieldEngineState } from "@mine/contracts";
import { SHIELD_ENGINE_STATES } from "@mine/contracts";

export interface NativeEngineLike {
  replaceFilters(lists: string[]): void;
  check(
    url: string,
    sourceUrl: string,
    resourceType: string,
  ): { blocked: boolean; matchedFilter: string | null };
}

export class ShieldEngine {
  #native: NativeEngineLike | null = null;
  #state: ShieldEngineState = "uninitialised";
  #lastError: string | null = null;
  #enabled = true;
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
    // Disabled short-circuits before the state read and the native call —
    // one boolean compare replaces the whole lookup, nothing is added
    // inside the query path itself (1ms budget, CLAUDE.md).
    if (!this.#enabled) {
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
