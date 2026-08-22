import { describe, expect, it } from "vitest";
import { BlockedCounter } from "./stats.js";

describe("BlockedCounter", () => {
  it("counts monotonically from zero", () => {
    const counter = new BlockedCounter();
    expect(counter.total).toBe(0);
    counter.increment();
    counter.increment(4);
    expect(counter.total).toBe(5);
  });

  it("rejects nonsense increments instead of silently absorbing them", () => {
    const counter = new BlockedCounter();
    expect(() => counter.increment(-1)).toThrow();
    expect(() => counter.increment(1.5)).toThrow();
  });
});
