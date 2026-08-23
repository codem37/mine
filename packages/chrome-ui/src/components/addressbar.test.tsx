import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ShieldStats } from "@mine/contracts";
import { AddressBar } from "./AddressBar.js";

function shield(overrides: Partial<ShieldStats> = {}): ShieldStats {
  return {
    tabId: null,
    blockedCount: 0,
    adsBlocked: 0,
    trackersBlocked: 0,
    engineState: "ready",
    lastError: null,
    enabled: true,
    ...overrides,
  };
}

function render(s: ShieldStats | null): string {
  return renderToStaticMarkup(
    <AddressBar activeTabId="tab-1" activeUrl="https://example.com/" shield={s} />,
  );
}

describe("AddressBar shield toggle", () => {
  it("renders pressed with a turn-off label while the shield is on", () => {
    const html = render(shield({ enabled: true }));
    expect(html).toMatch(/aria-label="turn shield off"/);
    expect(html).toMatch(/aria-pressed="true"/);
    expect(html).not.toMatch(/addressbar__shield--off/);
  });

  it("renders unpressed and dimmed-state class when the shield is off", () => {
    const html = render(shield({ enabled: false }));
    expect(html).toMatch(/aria-label="turn shield on"/);
    expect(html).toMatch(/aria-pressed="false"/);
    expect(html).toMatch(/addressbar__shield--off/);
  });

  it("is a plain button so pressing it never submits the address form", () => {
    const html = render(shield());
    expect(html).toMatch(/type="button"/);
  });

  it("stays disabled until real shield state has arrived", () => {
    const html = render(null);
    expect(html).toMatch(/disabled=""/);
    expect(html).toMatch(/aria-pressed="true"/);
  });

  it("keeps the address input alongside the toggle", () => {
    const html = render(shield());
    expect(html).toMatch(/aria-label="address"/);
  });
});
