import { describe, expect, it } from "vitest";
import { CHROME_HEIGHT } from "./constants.js";

describe("CHROME_HEIGHT", () => {
  it("is a positive integer usable as both a CSS value and a view bound", () => {
    expect(Number.isInteger(CHROME_HEIGHT)).toBe(true);
    expect(CHROME_HEIGHT).toBeGreaterThan(0);
  });
});
