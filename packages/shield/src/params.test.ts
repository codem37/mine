import { describe, expect, it } from "vitest";
import { stripTrackingParams } from "./params.js";

describe("stripTrackingParams", () => {
  it("removes utm and click-id params while preserving the rest", () => {
    expect(
      stripTrackingParams(
        "https://example.com/page?q=shoes&utm_source=news&fbclid=abc",
      ),
    ).toBe("https://example.com/page?q=shoes");
  });

  it("leaves clean urls byte-identical", () => {
    const url = "https://example.com/page?a=1&b=2";
    expect(stripTrackingParams(url)).toBe(url);
  });

  it("drops the dangling question mark when the only param was tracking", () => {
    expect(stripTrackingParams("https://example.com/page?gclid=x")).toBe(
      "https://example.com/page",
    );
  });

  it("is case-insensitive on param names", () => {
    expect(
      stripTrackingParams("https://example.com/?UTM_SOURCE=x&id=7"),
    ).toBe("https://example.com/?id=7");
  });

  it("passes through non-http schemes and garbage untouched", () => {
    expect(stripTrackingParams("mine://chrome/")).toBe("mine://chrome/");
    expect(stripTrackingParams("not a url")).toBe("not a url");
  });
});
