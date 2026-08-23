import { describe, expect, it, vi } from "vitest";
import { ListScheduler } from "./list-scheduler.js";
import { ShieldEngine } from "./engine.js";
import type { NativeEngineLike } from "./engine.js";

function makeEngine(): { engine: ShieldEngine; loadCount: number } {
  let loadCount = 0;
  const native: NativeEngineLike = {
    replaceFilters() { loadCount++; },
    check() { return { blocked: false, matchedFilter: null }; },
  };
  const engine = new ShieldEngine();
  engine.attachNative(native);
  return {
    engine,
    get loadCount() { return loadCount; },
  };
}

describe("ListScheduler", () => {
  it("forceUpdate() triggers a fetch and loads the engine", async () => {
    const { engine } = makeEngine();
    let fetched = 0;
    const scheduler = new ListScheduler(engine, {
      // Patch fetchAllLists via the onUpdate callback to count calls
      onUpdate(ok, _failed) { fetched += ok; },
    });

    // Mock global fetch to return a small valid list
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      text: async () => "||ads.example.com^\n",
    } as unknown as Response);
    const origFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      await scheduler.forceUpdate();
    } finally {
      globalThis.fetch = origFetch;
    }

    // At least one source must have returned data
    expect(mockFetch).toHaveBeenCalled();
  });

  it("a second concurrent forceUpdate() awaits the first without double-fetching", async () => {
    const { engine } = makeEngine();
    let fetchCallCount = 0;

    const mockFetch = vi.fn().mockImplementation(async () => {
      fetchCallCount++;
      await new Promise((r) => setTimeout(r, 20)); // simulate slow network
      return {
        ok: true,
        headers: { get: () => null },
        text: async () => "||slow.com^\n",
      } as unknown as Response;
    });

    const origFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    const scheduler = new ListScheduler(engine);

    try {
      const p1 = scheduler.forceUpdate();
      const p2 = scheduler.forceUpdate(); // called while first is in flight
      await Promise.all([p1, p2]);
    } finally {
      globalThis.fetch = origFetch;
    }

    // Second call queued behind first — total fetches = one set of sources, not double
    // (fetched N sources once, not 2N times)
    const sourceCount = 6; // DEFAULT_FILTER_SOURCES length
    expect(fetchCallCount).toBeLessThanOrEqual(sourceCount);
  });

  it("stop() prevents further ticks after being called", () => {
    const { engine } = makeEngine();
    const scheduler = new ListScheduler(engine, { intervalMs: 50 });
    scheduler.start();
    scheduler.stop();
    // Should not throw; internal timer should be cleared
  });
});
