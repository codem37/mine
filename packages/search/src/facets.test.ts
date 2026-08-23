import { describe, expect, it } from "vitest";
import { inferDynamicFacets } from "./facets.js";
import type { SearchResult } from "@mine/contracts";

describe("Dynamic Facet Inference", () => {
  it("infers brand, RAM, CPU, and price range facets for shopping results", () => {
    const results: SearchResult[] = [
      {
        id: "1",
        url: "https://example.com/laptop1",
        title: "Lenovo Laptop",
        snippet: "Intel i7, 16GB RAM",
        engine: "google",
        score: 0.9,
        type: "product",
        domain: "example.com",
        price: 75000,
        specs: { brand: "Lenovo", ram: "16 GB", cpu: "Intel i7" },
      },
      {
        id: "2",
        url: "https://example.com/laptop2",
        title: "ASUS Laptop",
        snippet: "Ryzen 7, 16GB RAM",
        engine: "bing",
        score: 0.8,
        type: "product",
        domain: "example.com",
        price: 80000,
        specs: { brand: "ASUS", ram: "16 GB", cpu: "Ryzen 7" },
      },
    ];

    const facets = inferDynamicFacets(results, "shopping");
    expect(facets.find((f) => f.id === "brand")).toBeDefined();
    expect(facets.find((f) => f.id === "ram")).toBeDefined();
    expect(facets.find((f) => f.id === "price")?.range).toEqual([75000, 80000]);
  });
});
