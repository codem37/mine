import { describe, expect, it } from "vitest";
import { ShieldEngine } from "./engine.js";
import type { NativeEngineLike } from "./engine.js";

function fakeNative(rules: Map<string, boolean>): NativeEngineLike {
  return {
    replaceFilters(newRules: string[]): void {
      rules.set("__loaded__", newRules.length > 0);
    },
    check(url: string): { blocked: boolean; matchedFilter: string | null } {
      return rules.get(url)
        ? { blocked: true, matchedFilter: "NetworkFilter" }
        : { blocked: false, matchedFilter: null };
    },
  };
}

describe("ShieldEngine state machine", () => {
  it("starts uninitialised and fails honestly without a native module", async () => {
    const engine = new ShieldEngine();
    expect(engine.state).toBe("uninitialised");
    await engine.loadLists(async () => ["||ads.example.com^"]);
    expect(engine.state).toBe("failed");
  });

  it("goes loading then ready when lists load into an attached native", async () => {
    const engine = new ShieldEngine();
    engine.attachNative(fakeNative(new Map()));
    const states: string[] = [];
    engine.onStateChange((s) => states.push(s));
    await engine.loadLists(async () => ["||ads.example.com^"]);
    expect(states).toEqual(["loading", "ready"]);
    expect(engine.state).toBe("ready");
  });

  it("fails when every required source comes back empty", async () => {
    const engine = new ShieldEngine();
    engine.attachNative(fakeNative(new Map()));
    await engine.loadLists(async () => []);
    expect(engine.state).toBe("failed");
  });

  it("fail-open: requests pass while not ready, with no fake blocking", async () => {
    const engine = new ShieldEngine();
    const verdict = engine.checkRequest(
      "https://ads.example.com/x",
      "https://example.org/",
      "script",
    );
    expect(verdict).toEqual({ blocked: false, matchedFilter: null });
  });

  it("blocks only after ready, and survives a throwing native", async () => {
    const engine = new ShieldEngine();
    engine.attachNative(fakeNative(new Map([["https://ads.example.com/x", true]])));
    await engine.loadLists(async () => ["rule"]);
    expect(
      engine.checkRequest("https://ads.example.com/x", "", "script").blocked,
    ).toBe(true);

    const broken = new ShieldEngine();
    broken.attachNative({
      replaceFilters(): void {},
      check(): { blocked: boolean; matchedFilter: string | null } {
        throw new Error("native panic");
      },
    });
    await broken.loadLists(async () => ["rule"]);
    expect(broken.state).toBe("ready");
    expect(broken.checkRequest("https://anything/", "", "script").blocked).toBe(
      false,
    );
  });
});
