import { describe, expect, it } from "vitest";
import { CHROME_HEIGHT, TAB_RAIL_WIDTH } from "@mine/contracts";
import { contentBounds } from "./bounds.js";

describe("contentBounds", () => {
  it("offsets content below the chrome bar and right of the tab rail", () => {
    const r = contentBounds(1200, 800);
    expect(r.x).toBe(TAB_RAIL_WIDTH);
    expect(r.y).toBe(CHROME_HEIGHT);
    expect(r.width).toBe(1200 - TAB_RAIL_WIDTH);
    expect(r.height).toBe(800 - CHROME_HEIGHT);
  });

  it("never produces negative extents for tiny windows", () => {
    const r = contentBounds(10, 10);
    expect(r.x).toBe(TAB_RAIL_WIDTH);
    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });

  it("content extends to the right window edge (no right rail)", () => {
    const r = contentBounds(800, 600);
    expect(r.x + r.width).toBe(800);
  });
});
