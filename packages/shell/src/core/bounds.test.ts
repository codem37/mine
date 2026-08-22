import { describe, expect, it } from "vitest";
import { contentBounds } from "./bounds.js";

describe("contentBounds", () => {
  it("offsets tab content below the chrome bar", () => {
    const r = contentBounds(1200, 800);
    expect(r.x).toBe(0);
    expect(r.y).toBeGreaterThan(0);
    expect(r.width).toBe(1200);
    expect(r.height).toBe(800 - r.y);
  });

  it("never produces negative height for tiny windows", () => {
    expect(contentBounds(200, 10).height).toBe(0);
  });
});
