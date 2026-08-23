import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { SearchDiagnostics, SearchResult } from "@mine/contracts";
import { SearchModeTabs } from "./SearchModeTabs.js";
import { DynamicFacetBar } from "./DynamicFacetBar.js";
import { SearchResultsList } from "./SearchResultsList.js";
import { ProductComparisonModal } from "./ProductComparisonModal.js";
import { SearchDiagnosticsModal } from "./SearchDiagnosticsModal.js";

function makeProduct(): SearchResult {
  return {
    id: "p1",
    url: "https://example.com/p1",
    title: "Lenovo Legion 5 Pro",
    snippet: "Intel i7, 16GB RAM, RTX 4060 GPU",
    engine: "google",
    score: 0.9,
    type: "product",
    domain: "example.com",
    price: 74999,
    currency: "₹",
    seller: "TechStore",
    specs: { brand: "Lenovo", cpu: "Intel i7", ram: "16 GB" },
  };
}

describe("SearchModeTabs component", () => {
  it("renders search mode pills", () => {
    const html = renderToStaticMarkup(<SearchModeTabs currentMode="all" onSelectMode={() => {}} />);
    expect(html).toContain("All");
    expect(html).toContain("Shopping");
    expect(html).toContain("Academic");
  });
});

describe("DynamicFacetBar component", () => {
  it("renders dynamic facet filter pills", () => {
    const facets = [
      { id: "brand", label: "Brand", type: "checkbox" as const, values: [{ label: "Lenovo", value: "Lenovo", count: 3 }] },
    ];
    const html = renderToStaticMarkup(
      <DynamicFacetBar facets={facets} appliedFacets={{}} onToggleFacet={() => {}} onClearAll={() => {}} />
    );
    expect(html).toContain("Brand");
  });
});

describe("SearchResultsList component", () => {
  it("renders product cards with price and compare checkbox", () => {
    const p1 = makeProduct();
    const html = renderToStaticMarkup(<SearchResultsList results={[p1]} onOpenUrl={() => {}} onToggleCompare={() => {}} />);
    expect(html).toContain("Lenovo Legion 5 Pro");
    expect(html).toContain("₹74999");
    expect(html).toContain("Compare");
  });
});

describe("ProductComparisonModal component", () => {
  it("renders side-by-side product comparison table", () => {
    const p1 = makeProduct();
    const html = renderToStaticMarkup(<ProductComparisonModal products={[p1]} onClose={() => {}} />);
    expect(html).toContain("Product Comparison (1)");
    expect(html).toContain("Intel i7");
  });
});

describe("SearchDiagnosticsModal component", () => {
  it("renders search latency, cache status, and sources queried", () => {
    const diag: SearchDiagnostics = {
      sourcesQueried: 3,
      sourcesAvailable: 3,
      queryVariants: 4,
      resultsMerged: 12,
      resultsReranked: 5,
      cacheStatus: "HIT",
      latencyMs: 120,
    };
    const html = renderToStaticMarkup(<SearchDiagnosticsModal diagnostics={diag} onClose={() => {}} />);
    expect(html).toContain("Sources Queried:");
    expect(html).toContain("HIT");
    expect(html).toContain("120 ms");
  });
});
