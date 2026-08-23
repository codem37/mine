import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TabSnapshot } from "@mine/contracts";
import { TabStrip } from "./TabStrip.js";

function makeTab(overrides: Partial<TabSnapshot> = {}): TabSnapshot {
  return {
    id: "tab-1",
    url: "https://example.com/page",
    title: "Example Page",
    loadState: "loaded",
    canGoBack: false,
    canGoForward: false,
    ...overrides,
  };
}

describe("TabStrip component", () => {
  it("renders a list of tabs with active state and titles", () => {
    const tabs: TabSnapshot[] = [
      makeTab({ id: "tab-1", title: "Tab One" }),
      makeTab({ id: "tab-2", title: "Tab Two" }),
    ];
    const html = renderToStaticMarkup(
      <TabStrip tabs={tabs} activeTabId="tab-1" />,
    );
    expect(html).toContain("Tab One");
    expect(html).toContain("Tab Two");
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("tab--active");
  });

  it("renders favicon image when favicons array is provided", () => {
    const tabWithFavicon = makeTab({
      id: "tab-1",
      url: "https://example.com/",
      favicons: ["https://example.com/favicon.png"],
    });
    const html = renderToStaticMarkup(
      <TabStrip tabs={[tabWithFavicon]} activeTabId="tab-1" />,
    );
    expect(html).toContain('<img src="https://example.com/favicon.png"');
    expect(html).toContain('class="tab__favicon"');
  });

  it("falls back to site initial letter when favicons are absent", () => {
    const tabWithoutFavicon = makeTab({
      id: "tab-1",
      url: "https://github.com/google",
    });
    const html = renderToStaticMarkup(
      <TabStrip tabs={[tabWithoutFavicon]} activeTabId="tab-1" />,
    );
    expect(html).toContain(">G<");
    expect(html).not.toContain("<img");
  });

  it("renders custom glyph for internal mine:// URLs", () => {
    const newTab = makeTab({
      id: "tab-1",
      url: "mine://newtab/",
      title: "New Tab",
    });
    const html = renderToStaticMarkup(
      <TabStrip tabs={[newTab]} activeTabId="tab-1" />,
    );
    expect(html).toContain(">?<");
  });

  it("applies loading class during active navigation", () => {
    const loadingTab = makeTab({
      id: "tab-1",
      loadState: "started",
    });
    const html = renderToStaticMarkup(
      <TabStrip tabs={[loadingTab]} activeTabId="tab-1" />,
    );
    expect(html).toContain("tab--loading");
  });

  it("renders close button with tab-specific aria-label", () => {
    const tab = makeTab({ id: "tab-1", title: "My Tab" });
    const html = renderToStaticMarkup(
      <TabStrip tabs={[tab]} activeTabId="tab-1" />,
    );
    expect(html).toContain('aria-label="close My Tab"');
  });

  it("renders new tab button", () => {
    const html = renderToStaticMarkup(
      <TabStrip tabs={[]} activeTabId={null} />,
    );
    expect(html).toContain('aria-label="new tab"');
  });
});
