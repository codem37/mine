import { describe, expect, it } from "vitest";
import { inferCategory, extractFacets } from "./facets.js";

describe("Search Facets & Schema.org Inference", () => {
  it("infers category based on URL and text hints", () => {
    expect(inferCategory("https://github.com/facebook/react", "React", "Code repo")).toBe("code");
    expect(inferCategory("https://youtube.com/watch?v=123", "Video", "Watch online")).toBe("video");
    expect(inferCategory("https://en.wikipedia.org/wiki/Electron", "Electron", "Article")).toBe("article");
  });

  it("extracts and counts category facets", () => {
    const results = [
      { id: "1", url: "https://github.com/a", title: "A", snippet: "a", engine: "g", score: 1 },
      { id: "2", url: "https://github.com/b", title: "B", snippet: "b", engine: "g", score: 0.9 },
      { id: "3", url: "https://youtube.com/c", title: "C", snippet: "c", engine: "g", score: 0.8 },
    ];

    const facets = extractFacets(results);
    expect(facets).toContainEqual({ name: "code", count: 2 });
    expect(facets).toContainEqual({ name: "video", count: 1 });
  });
});
