/**
 * ListScheduler — background auto-update loop for Shield filter lists.
 *
 * - Runs at a configurable interval (default 24h).
 * - First tick is jittered by a random 0–60s delay to avoid thundering-herd.
 * - Guards against concurrent fetches.
 * - forceUpdate() triggers an immediate refresh outside the schedule.
 */
import {
  fetchAllLists,
  writeCache,
  allSources,
} from "./lists.js";
import type { ShieldEngine } from "./engine.js";

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const JITTER_MS = 60_000; // up to 60s startup jitter

export interface SchedulerOptions {
  readonly intervalMs?: number;
  readonly cacheDir?: string;
  readonly onUpdate?: (ok: number, failed: number) => void;
  readonly onError?: (err: unknown) => void;
}

export class ListScheduler {
  readonly #engine: ShieldEngine;
  readonly #options: Required<SchedulerOptions>;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #running = false;
  #fetchInProgress = false;
  #pendingForce: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];

  constructor(engine: ShieldEngine, options: SchedulerOptions = {}) {
    this.#engine = engine;
    this.#options = {
      intervalMs: options.intervalMs ?? DEFAULT_INTERVAL_MS,
      cacheDir: options.cacheDir ?? ".shield-cache",
      onUpdate: options.onUpdate ?? (() => undefined),
      onError: options.onError ?? (() => undefined),
    };
  }

  /** Start the auto-update loop with a startup jitter delay. */
  start(): void {
    if (this.#running) return;
    this.#running = true;
    // Jitter first tick to avoid hammering filter servers on every startup
    const jitter = Math.floor(Math.random() * JITTER_MS);
    this.#timer = setTimeout(() => {
      void this.#tick();
    }, jitter);
  }

  /** Stop the scheduler (pending tick is cancelled, in-progress fetch completes). */
  stop(): void {
    this.#running = false;
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  /**
   * Force an immediate list refresh.
   * If a fetch is already in progress, waits for it to complete.
   */
  async forceUpdate(): Promise<void> {
    if (this.#fetchInProgress) {
      // Queue behind the ongoing fetch
      return new Promise((resolve, reject) => {
        this.#pendingForce.push({ resolve, reject });
      });
    }
    await this.#doFetch();
  }

  async #tick(): Promise<void> {
    if (!this.#running) return;
    await this.#doFetch();
    if (!this.#running) return;
    this.#timer = setTimeout(() => {
      void this.#tick();
    }, this.#options.intervalMs);
  }

  async #doFetch(): Promise<void> {
    if (this.#fetchInProgress) return;
    this.#fetchInProgress = true;
    try {
      const sources = allSources();
      const outcomes = await fetchAllLists(sources);

      // Write successful fetches to disk cache
      const successful: string[] = [];
      let failed = 0;
      for (const outcome of outcomes) {
        if (outcome.ok && outcome.data !== null) {
          await writeCache(this.#options.cacheDir, outcome.name, outcome.data).catch(() => {
            // Cache write failing is non-fatal
          });
          successful.push(outcome.data);
        } else {
          failed++;
        }
      }

      if (successful.length > 0) {
        await this.#engine.loadLists(async () => successful);
      }

      this.#options.onUpdate(successful.length, failed);

      // Resolve any waiting forceUpdate() callers
      for (const pending of this.#pendingForce) pending.resolve();
    } catch (err) {
      this.#options.onError(err);
      for (const pending of this.#pendingForce) pending.reject(err);
    } finally {
      this.#pendingForce = [];
      this.#fetchInProgress = false;
    }
  }
}
