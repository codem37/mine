import { describe, expect, it } from "vitest";
import { SHIELD_ENGINE_STATES } from "./verdict.js";
import type { RequestVerdict } from "./verdict.js";

describe("RequestVerdict", () => {
  it("models a pass with no matched filter", () => {
    const verdict: RequestVerdict = { blocked: false, matchedFilter: null };
    expect(verdict.blocked).toBe(false);
  });

  it("models a block carrying the matching filter for stats", () => {
    const verdict: RequestVerdict = {
      blocked: true,
      matchedFilter: "||example-tracker.com^",
    };
    expect(verdict.blocked).toBe(true);
  });
});

describe("SHIELD_ENGINE_STATES", () => {
  it("offers named states instead of a fake loading percentage", () => {
    expect(SHIELD_ENGINE_STATES).toContain("loading");
    expect(SHIELD_ENGINE_STATES).not.toContain("37%");
  });
});
