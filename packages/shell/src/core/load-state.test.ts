import { describe, expect, it } from "vitest";
import { toLoadState } from "./load-state.js";

describe("toLoadState", () => {
  it("maps electron lifecycle events onto named states", () => {
    expect(toLoadState("none")).toBe("idle");
    expect(toLoadState("start")).toBe("started");
    expect(toLoadState("navigate")).toBe("committed");
    expect(toLoadState("in-page")).toBe("committed");
    expect(toLoadState("dom-ready")).toBe("dom-ready");
    expect(toLoadState("finish")).toBe("loaded");
    expect(toLoadState("fail")).toBe("failed");
  });

  it("never yields a number — progress is a named state, not a fake percentage", () => {
    const events = ["none", "start", "navigate", "in-page", "dom-ready", "finish", "fail"] as const;
    for (const e of events) {
      expect(typeof toLoadState(e)).toBe("string");
    }
  });
});
