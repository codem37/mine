import { describe, expect, it } from "vitest";
import { reciprocalRankFusion } from "./fusion.js";
import type { SearchResult } from "@mine/contracts";

describe("Reciprocal Rank Fusion (RRF)", () => {
  it("scores and ranks items appearing in multiple engine lists higher", () => {
    const r1: SearchResult = { id: "1", url: "https://a.com", title: "A", snippet: "a", engine: "", score: 0, type: "web", domain: "a.com" };
    const r2: SearchResult = { id: "2", url: "https://b.com", title: "B", snippet: "b", engine: "", score: 0, type: "web", domain: "b.com" };
    const r3: SearchResult = { id: "3", url: "https://c.com", title: "C", snippet: "c", engine: "", score: 0, type: "web", domain: "c.com" };

    const list1 = {
      engineName: "google",
      results: [r1, r2],
    };
    const list2 = {
      engineName: "bing",
      results: [r2, r3],
    };

    const fused = reciprocalRankFusion([list1, list2]);
    expect(fused[0]?.url).toBe("https://b.com");
    expect(fused[0]?.engine).toContain("google");
    expect(fused[0]?.engine).toContain("bing");
    expect(fused[0]?.sourceCount).toBe(2);
  });
});
