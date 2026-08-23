import { describe, expect, it } from "vitest";
import { CHROME_HEIGHT, TAB_RAIL_WIDTH } from "./constants.js";

describe("CHROME_HEIGHT", () => {
  it("is a positive integer usable as both a CSS value and a view bound", () => {
    expect(Number.isInteger(CHROME_HEIGHT)).toBe(true);
    expect(CHROME_HEIGHT).toBeGreaterThan(0);
  });
});

describe("TAB_RAIL_WIDTH (ADR 0007)", () => {
  it("is a positive integer usable as both a CSS value and a view bound", () => {
    expect(Number.isInteger(TAB_RAIL_WIDTH)).toBe(true);
    expect(TAB_RAIL_WIDTH).toBeGreaterThan(0);
  });

  it("leaves usable content beside the tab rail on the smallest supported window", () => {
    // shell enforces minWidth 800; tab rail must not consume it all
    expect(TAB_RAIL_WIDTH).toBeLessThan(800);
  });
});
