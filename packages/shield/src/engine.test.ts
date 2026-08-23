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

describe("ShieldEngine enable/disable", () => {
  it("is enabled by default", () => {
    expect(new ShieldEngine().enabled).toBe(true);
  });

  it("disabled short-circuits before the engine is queried, then re-enables", async () => {
    const rules = new Map<string, boolean>([["https://ads.example.com/x", true]]);
    let queried = false;
    const native = fakeNative(rules);
    const engine = new ShieldEngine();
    engine.attachNative({
      replaceFilters(lists: string[]): void {
        native.replaceFilters(lists);
      },
      check(url: string): { blocked: boolean; matchedFilter: string | null } {
        queried = true;
        return native.check(url, "", "script");
      },
    });
    await engine.loadLists(async () => ["rule"]);

    engine.setEnabled(false);
    expect(engine.enabled).toBe(false);
    expect(
      engine.checkRequest("https://ads.example.com/x", "", "script"),
    ).toEqual({ blocked: false, matchedFilter: null });
    expect(queried).toBe(false);

    engine.setEnabled(true);
    expect(
      engine.checkRequest("https://ads.example.com/x", "", "script").blocked,
    ).toBe(true);
    expect(queried).toBe(true);
  });

  it("disable wins even while lists are still loading (state is not 'ready')", async () => {
    const engine = new ShieldEngine();
    engine.attachNative(fakeNative(new Map()));
    engine.setEnabled(false);
    expect(
      engine.checkRequest("https://ads.example.com/", "", "script").blocked,
    ).toBe(false);
    expect(engine.state).not.toBe("ready");
  });
});

describe("ShieldEngine allowlist", () => {
  it("allows sites on the allowlist to bypass blocking", async () => {
    const rules = new Map<string, boolean>([["https://googlevideo.com/videoplayback", true]]);
    const engine = new ShieldEngine();
    engine.attachNative(fakeNative(rules));
    await engine.loadLists(async () => ["rule"]);

    expect(engine.checkRequest("https://googlevideo.com/videoplayback", "https://youtube.com/", "media").blocked).toBe(true);

    engine.allowSite("youtube.com");
    expect(engine.isSiteAllowed("https://youtube.com/watch?v=123")).toBe(true);
    expect(engine.checkRequest("https://googlevideo.com/videoplayback", "https://youtube.com/watch?v=123", "media").blocked).toBe(false);

    engine.disallowSite("youtube.com");
    expect(engine.checkRequest("https://googlevideo.com/videoplayback", "https://youtube.com/", "media").blocked).toBe(true);
  });
});
