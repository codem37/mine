import type { DynamicFacet, SearchMode, SearchResult } from "@mine/contracts";

export function inferDynamicFacets(results: readonly SearchResult[], mode: SearchMode): DynamicFacet[] {
  if (results.length === 0) return [];

  const facets: DynamicFacet[] = [];

  if (mode === "shopping" || mode === "all") {
    // Brand facet
    const brandCounts = new Map<string, number>();
    // RAM facet
    const ramCounts = new Map<string, number>();
    // CPU facet
    const cpuCounts = new Map<string, number>();
    // Prices
    const prices: number[] = [];

    for (const r of results) {
      if (r.price) prices.push(r.price);
      if (r.specs?.brand) {
        brandCounts.set(r.specs.brand, (brandCounts.get(r.specs.brand) ?? 0) + 1);
      }
      if (r.specs?.ram) {
        ramCounts.set(r.specs.ram, (ramCounts.get(r.specs.ram) ?? 0) + 1);
      }
      if (r.specs?.cpu) {
        cpuCounts.set(r.specs.cpu, (cpuCounts.get(r.specs.cpu) ?? 0) + 1);
      }
    }

    if (brandCounts.size > 0) {
      facets.push({
        id: "brand",
        label: "Brand",
        type: "checkbox",
        values: Array.from(brandCounts.entries()).map(([k, v]) => ({ label: k, value: k, count: v })),
      });
    }

    if (ramCounts.size > 0) {
      facets.push({
        id: "ram",
        label: "RAM",
        type: "checkbox",
        values: Array.from(ramCounts.entries()).map(([k, v]) => ({ label: k, value: k, count: v })),
      });
    }

    if (cpuCounts.size > 0) {
      facets.push({
        id: "cpu",
        label: "CPU",
        type: "checkbox",
        values: Array.from(cpuCounts.entries()).map(([k, v]) => ({ label: k, value: k, count: v })),
      });
    }

    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      facets.push({
        id: "price",
        label: "Price Range",
        type: "range",
        values: [],
        range: [minPrice, maxPrice],
      });
    }
  }

  if (mode === "academic") {
    const yearCounts = new Map<string, number>();
    for (const r of results) {
      if (r.year) {
        const yStr = r.year.toString();
        yearCounts.set(yStr, (yearCounts.get(yStr) ?? 0) + 1);
      }
    }
    if (yearCounts.size > 0) {
      facets.push({
        id: "year",
        label: "Publication Year",
        type: "checkbox",
        values: Array.from(yearCounts.entries()).map(([k, v]) => ({ label: k, value: k, count: v })),
      });
    }
  }

  return facets;
}
