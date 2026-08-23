/**
 * BlockedCounters — split tracking of ads vs trackers blocked.
 * getDiagnostics() returns aggregate counts only; no URLs, no query strings.
 */
export class BlockedCounters {
  #ads = 0;
  #trackers = 0;

  incrementAds(amount = 1): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`invalid block count increment: ${amount}`);
    }
    this.#ads += amount;
  }

  incrementTrackers(amount = 1): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`invalid block count increment: ${amount}`);
    }
    this.#trackers += amount;
  }

  /** Legacy single-total increment (used by existing code paths) */
  increment(amount = 1): void {
    this.incrementAds(amount);
  }

  get adsBlocked(): number {
    return this.#ads;
  }

  get trackersBlocked(): number {
    return this.#trackers;
  }

  /** Total across all categories */
  get total(): number {
    return this.#ads + this.#trackers;
  }
}

/** @deprecated Use BlockedCounters; kept for backward compat with tests */
export class BlockedCounter {
  #total = 0;

  increment(amount = 1): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`invalid block count increment: ${amount}`);
    }
    this.#total += amount;
  }

  get total(): number {
    return this.#total;
  }
}
