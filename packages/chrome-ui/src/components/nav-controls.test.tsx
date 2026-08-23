import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TabSnapshot } from "@mine/contracts";
import { NavControls } from "./NavControls.js";

function tab(overrides: Partial<TabSnapshot> = {}): TabSnapshot {
  return {
    id: "tab-1",
    url: "https://example.com/",
    title: "example",
    loadState: "loaded",
    canGoBack: false,
    canGoForward: false,
    ...overrides,
  };
}

function render(active: TabSnapshot | null): string {
  return renderToStaticMarkup(<NavControls active={active} />);
}

describe("NavControls reflects real navigation state", () => {
  it("renders back/forward/reload with aria-labels", () => {
    const html = render(tab());
    expect(html).toMatch(/aria-label="go back"/);
    expect(html).toMatch(/aria-label="go forward"/);
    expect(html).toMatch(/aria-label="reload page"/);
  });

  it("disables history buttons when there is no history to traverse", () => {
    const html = render(tab({ canGoBack: false, canGoForward: false }));
    const disabledCount = html.match(/disabled=""/g)?.length ?? 0;
    expect(disabledCount).toBe(2);
  });

  it("enables each direction only when history allows it", () => {
    expect(render(tab({ canGoBack: true }))).not.toMatch(
      /aria-label="go back"[^>]*disabled/,
    );
    expect(render(tab({ canGoForward: true }))).not.toMatch(
      /aria-label="go forward"[^>]*disabled/,
    );
  });

  it("swaps reload for stop while the tab is loading", () => {
    for (const loadState of ["started", "committed", "dom-ready"] as const) {
      expect(render(tab({ loadState }))).toMatch(
        /aria-label="stop loading"/,
      );
      expect(render(tab({ loadState }))).toContain("\u2715");
    }
    for (const loadState of ["idle", "loaded", "failed"] as const) {
      expect(render(tab({ loadState }))).toMatch(/aria-label="reload page"/);
      expect(render(tab({ loadState }))).toContain("\u27F3");
    }
  });

  it("everything is inert with no active tab — no fabricated enabled state", () => {
    const html = render(null);
    expect(html.match(/disabled=""/g)?.length).toBe(3);
    expect(html).toMatch(/aria-label="reload page"/);
  });
});
