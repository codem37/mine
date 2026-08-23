import { describe, expect, it } from "vitest";
import { SearchEngine } from "./engine.js";

describe("SearchEngine", () => {
  it("executes search query and caches results", async () => {
    const engine = new SearchEngine();
    const res1 = await engine.search({ query: "electron" });
    expect(res1.query).toBe("electron");
    expect(res1.results.length).toBeGreaterThan(0);

    const res2 = await engine.search({ query: "electron" });
    expect(res2).toEqual(res1);
  });
});
