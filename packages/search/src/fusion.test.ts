import { describe, expect, it } from "vitest";
import { reciprocalRankFusion } from "./fusion.js";

describe("Reciprocal Rank Fusion (RRF)", () => {
  it("scores and ranks items appearing in multiple engine lists higher", () => {
    const list1 = {
      engineName: "google",
      results: [
        { id: "1", url: "https://a.com", title: "A", snippet: "a" },
        { id: "2", url: "https://b.com", title: "B", snippet: "b" },
      ],
    };
    const list2 = {
      engineName: "bing",
      results: [
        { id: "2", url: "https://b.com", title: "B", snippet: "b" },
        { id: "3", url: "https://c.com", title: "C", snippet: "c" },
      ],
    };

    const fused = reciprocalRankFusion([list1, list2]);
    expect(fused[0]?.url).toBe("https://b.com");
    expect(fused[0]?.engine).toContain("google");
    expect(fused[0]?.engine).toContain("bing");
  });
});
