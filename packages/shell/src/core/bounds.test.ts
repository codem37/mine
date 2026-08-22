import { describe, expect, it } from "vitest";
import { CHROME_HEIGHT, TELEMETRY_RAIL_WIDTH } from "@mine/contracts";
import { contentBounds } from "./bounds.js";

describe("contentBounds", () => {
  it("offsets tab content below the chrome bar and left of the rail", () => {
    const r = contentBounds(1200, 800);
    expect(r.x).toBe(0);
    expect(r.y).toBe(CHROME_HEIGHT);
    expect(r.width).toBe(1200 - TELEMETRY_RAIL_WIDTH);
    expect(r.height).toBe(800 - CHROME_HEIGHT);
  });

  it("never produces negative extents for tiny windows", () => {
    const r = contentBounds(10, 10);
    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });
});
