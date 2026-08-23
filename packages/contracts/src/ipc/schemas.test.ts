import { describe, expect, it } from "vitest";
import {
  DownloadIdRequestSchema,
  DownloadItemSchema,
  DownloadSegmentSchema,
  NavigateRequestSchema,
  NavigationStateSchema,
  NewTabRequestSchema,
  SetShieldEnabledRequestSchema,
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

  it("accepts tab snapshots with favicons array", () => {
    const withFavicon = {
      ...snapshot,
      favicons: ["https://example.com/favicon.ico"],
    };
    const parsed = TabListSchema.parse([withFavicon]);
    expect(parsed[0]?.favicons).toEqual(["https://example.com/favicon.ico"]);
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
        enabled: true,
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
        enabled: true,
      }),
    ).not.toThrow();
  });

  it("carries lastError so a failed engine can say why", () => {
    const parsed = ShieldStatsSchema.parse({
      tabId: null,
      blockedCount: 0,
      engineState: "failed",
      lastError: "required filter source 'easylist' unavailable",
      enabled: true,
    });
    expect(parsed.lastError).toBe(
      "required filter source 'easylist' unavailable",
    );
  });

  it("carries the enabled flag so the UI can show on vs off", () => {
    const off = ShieldStatsSchema.parse({
      tabId: null,
      blockedCount: 0,
      engineState: "ready",
      lastError: null,
      enabled: false,
    });
    expect(off.enabled).toBe(false);
  });

  it("rejects negative counts, unknown states, missing lastError, missing enabled", () => {
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "t",
        blockedCount: -1,
        engineState: "ready",
        lastError: null,
        enabled: true,
      }),
    ).toThrow();
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "t",
        blockedCount: 0,
        engineState: "99%",
        lastError: null,
        enabled: true,
      }),
    ).toThrow();
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "t",
        blockedCount: 0,
        engineState: "ready",
      }),
    ).toThrow();
    expect(() =>
      ShieldStatsSchema.parse({
        tabId: "t",
        blockedCount: 0,
        engineState: "ready",
        lastError: null,
      }),
    ).toThrow();
  });
});

describe("SetShieldEnabledRequestSchema", () => {
  it("accepts an explicit boolean", () => {
    expect(SetShieldEnabledRequestSchema.parse({ enabled: true })).toEqual({
      enabled: true,
    });
    expect(SetShieldEnabledRequestSchema.parse({ enabled: false })).toEqual({
      enabled: false,
    });
  });

  it("rejects truthy non-boolean values", () => {
    expect(() => SetShieldEnabledRequestSchema.parse({ enabled: 1 })).toThrow();
    expect(() =>
      SetShieldEnabledRequestSchema.parse({ enabled: "yes" }),
    ).toThrow();
    expect(() => SetShieldEnabledRequestSchema.parse({})).toThrow();
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

describe("Download schemas", () => {
  it("validates a complete DownloadItem and segment details", () => {
    const item = {
      id: "dl-1",
      filename: "ubuntu.iso",
      url: "https://releases.ubuntu.com/ubuntu.iso",
      savePath: "/tmp/ubuntu.iso",
      state: "downloading" as const,
      downloadedBytes: 1024 * 1024,
      totalBytes: 50 * 1024 * 1024,
      speedBytesPerSec: 512 * 1024,
      etaSeconds: 98,
      segments: [
        {
          id: 0,
          startByte: 0,
          endByte: 1000,
          downloadedBytes: 500,
          progressPercent: 50,
          active: true,
        },
      ],
    };
    expect(() => DownloadItemSchema.parse(item)).not.toThrow();
  });

  it("validates magnet links for torrent downloads", () => {
    const torrentItem = {
      id: "dl-torrent-1",
      filename: "archive.zip",
      url: "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b33537709a23e290&dn=archive.zip",
      state: "downloading" as const,
      downloadedBytes: 0,
      totalBytes: 10000,
      speedBytesPerSec: 100,
      etaSeconds: 100,
      segments: [],
      isTorrent: true,
      peersCount: 8,
    };
    expect(() => DownloadItemSchema.parse(torrentItem)).not.toThrow();
  });

  it("validates DownloadIdRequestSchema and rejects empty id", () => {
    expect(DownloadIdRequestSchema.parse({ downloadId: "dl-1" })).toEqual({
      downloadId: "dl-1",
    });
    expect(() => DownloadIdRequestSchema.parse({ downloadId: "" })).toThrow();
  });
});
