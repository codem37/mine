import { describe, expect, it } from "vitest";
import { SearchEngine } from "./engine.js";

describe("SearchEngine Phase 6", () => {
  it("performs search query processing, RRF fusion, and dynamic facet inference", async () => {
    const engine = new SearchEngine();
    const res = await engine.search({ query: "best laptop under ₹80000" });

    expect(res.query).toBe("best laptop under ₹80000");
    expect(res.mode).toBe("shopping");
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.facets.length).toBeGreaterThan(0);
    expect(res.diagnostics.sourcesQueried).toBe(3);
    expect(res.cacheStatus).toBe("MISS");
  });

  it("serves cached search results on repeated identical query", async () => {
    const engine = new SearchEngine();
    await engine.search({ query: "python tutorial" });
    const cached = await engine.search({ query: "python tutorial" });

    expect(cached.cacheStatus).toBe("HIT");
    expect(cached.diagnostics.cacheStatus).toBe("HIT");
  });

  it("handles video and academic search modes with specialized metadata", async () => {
    const engine = new SearchEngine();
    const videoRes = await engine.search({ query: "Interstellar trailer", mode: "videos" });
    expect(videoRes.results[0]?.type).toBe("video");
    expect(videoRes.results[0]?.durationSeconds).toBeDefined();

    const acadRes = await engine.search({ query: "deep learning survey", mode: "academic" });
    expect(acadRes.results[0]?.type).toBe("academic");
    expect(acadRes.results[0]?.doi).toBeDefined();
  });
});
