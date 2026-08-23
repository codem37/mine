import { describe, expect, it } from "vitest";
import {
  NavigateRequestSchema,
  NavigationStateSchema,
  NewTabRequestSchema,
  ShieldStatsSchema,
  TabListSchema,
  TabsUpdatedPayloadSchema,
} from "./schemas.js";
import type { TabSnapshot } from "../types/tab.js";

const snapshot: TabSnapshot = {
  id: "tab-1",
  url: "https://example.com/",
  title: "Example",
  loadState: "loaded",
  canGoBack: false,
  canGoForward: true,
};

describe("NavigateRequestSchema", () => {
  it("accepts a tab id and an absolute url", () => {
    const parsed = NavigateRequestSchema.parse({
      tabId: "tab-1",
      url: "https://example.com/page",
    });
    expect(parsed.url).toBe("https://example.com/page");
  });

  it("rejects a relative string as a url", () => {
    expect(() =>
      NavigateRequestSchema.parse({ tabId: "tab-1", url: "not-a-url" }),
    ).toThrow();
  });

  it("rejects an empty tab id", () => {
    expect(() =>
      NavigateRequestSchema.parse({ tabId: "", url: "https://example.com/" }),
    ).toThrow();
  });
});

describe("TabsUpdatedPayloadSchema", () => {
  it("validates a full tab list with an active tab", () => {
    expect(() =>
      TabsUpdatedPayloadSchema.parse({
        tabs: [snapshot],
        activeTabId: "tab-1",
      }),
    ).not.toThrow();
  });

  it("allows no active tab", () => {
    expect(() =>
      TabsUpdatedPayloadSchema.parse({ tabs: [], activeTabId: null }),
    ).not.toThrow();
  });

  it("rejects an unknown load state (named states, not fake progress)", () => {
    expect(() =>
      TabListSchema.parse([
        { ...snapshot, loadState: "37%" },
      ]),
    ).toThrow();
  });
});

describe("NewTabRequestSchema", () => {
  it("accepts a tab opened with no initial url", () => {
    expect(() => NewTabRequestSchema.parse({})).not.toThrow();
  });

  it("accepts an optional initial url", () => {
    expect(() =>
      NewTabRequestSchema.parse({ url: "https://example.com/" }),
    ).not.toThrow();
  });

  it("rejects an initial url that is not absolute", () => {
    expect(() => NewTabRequestSchema.parse({ url: "example.com" })).toThrow();
  });
});

describe("ShieldStatsSchema", () => {
  it("accepts a per-tab count with a named engine state", () => {
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "tab-1",
        blockedCount: 12,
        engineState: "ready",
        lastError: null,
      }),
    ).not.toThrow();
  });

  it("allows a null tab for engine-wide state changes", () => {
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: null,
        blockedCount: 0,
        engineState: "loading",
        lastError: null,
      }),
    ).not.toThrow();
  });

  it("carries lastError so a failed engine can say why", () => {
    const parsed = ShieldStatsSchema.parse({
      tabId: null,
      blockedCount: 0,
      engineState: "failed",
      lastError: "required filter source 'easylist' unavailable",
    });
    expect(parsed.lastError).toBe(
      "required filter source 'easylist' unavailable",
    );
  });

  it("rejects negative counts, unknown states, and missing lastError", () => {
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "t",
        blockedCount: -1,
        engineState: "ready",
        lastError: null,
      }),
    ).toThrow();
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "t",
        blockedCount: 0,
        engineState: "99%",
        lastError: null,
      }),
    ).toThrow();
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "t",
        blockedCount: 0,
        engineState: "ready",
      }),
    ).toThrow();
  });
});

describe("NavigationStateSchema", () => {
  it("accepts a failed navigation with a Chromium error code (net::ERR_* are negative)", () => {
    expect(() =>
      NavigationStateSchema.parse({
        url: "https://example.com/",
        canGoBack: true,
        canGoForward: false,
        loadState: "failed",
        errorCode: -3,
      }),
    ).not.toThrow();
  });

  it("rejects a non-integer error code", () => {
    expect(() =>
      NavigationStateSchema.parse({
        url: "https://example.com/",
        canGoBack: false,
        canGoForward: false,
        loadState: "failed",
        errorCode: -3.5,
      }),
    ).toThrow();
  });
});
