/**
 * shield.test.tsx — render tests for ShieldPanel and FilterListModal using renderToStaticMarkup.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ShieldPanel } from "./ShieldPanel.js";
import { FilterListModal } from "./FilterListModal.js";

describe("ShieldPanel component", () => {
  it("renders domain name and title", () => {
    const html = renderToStaticMarkup(
      <ShieldPanel
        domain="example.com"
        onClose={() => undefined}
        onOpenFilterLists={() => undefined}
      />,
    );
    expect(html).toContain("example.com");
    expect(html).toContain("Shield");
    expect(html).toContain("data-testid=\"shield-panel\"");
  });

  it("renders block toggles and stats section", () => {
    const html = renderToStaticMarkup(
      <ShieldPanel
        domain="test.com"
        onClose={() => undefined}
        onOpenFilterLists={() => undefined}
      />,
    );
    expect(html).toContain("Block Ads");
    expect(html).toContain("Block Trackers");
    expect(html).toContain("Cosmetic Filtering");
    expect(html).toContain("Manage Filter Lists");
  });
});

describe("FilterListModal component", () => {
  it("renders Filter Lists title, diagnostics, and force update button", () => {
    const html = renderToStaticMarkup(
      <FilterListModal onClose={() => undefined} />,
    );
    expect(html).toContain("Filter Lists");
    expect(html).toContain("data-testid=\"filter-list-modal\"");
    expect(html).toContain("Force Update All");
    expect(html).toContain("Add Custom List");
  });

  it("includes HTTPS privacy note", () => {
    const html = renderToStaticMarkup(
      <FilterListModal onClose={() => undefined} />,
    );
    expect(html).toContain("No browsing data is included in filter list updates");
  });
});
