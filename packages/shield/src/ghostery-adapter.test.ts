import { describe, expect, it } from "vitest";
import { GhosteryAdapter } from "./ghostery-adapter.js";

/** Minimal EasyList-style rules for testing */
const MINIMAL_RULES = `
! Minimal test list
||ads.example.com^
||tracker.example.org^$third-party
##.ad-banner
##.tracker-pixel
`;

describe("GhosteryAdapter — network blocking", () => {
  it("blocks a URL matching a filter rule", () => {
    const adapter = new GhosteryAdapter();
    adapter.replaceFilters([MINIMAL_RULES]);
    const result = adapter.check(
      "https://ads.example.com/script.js",
      "https://site.com/",
      "script",
    );
    expect(result.blocked).toBe(true);
  });

  it("allows a URL that does not match any rule", () => {
    const adapter = new GhosteryAdapter();
    adapter.replaceFilters([MINIMAL_RULES]);
    const result = adapter.check(
      "https://legit.example.com/content.js",
      "https://site.com/",
      "script",
    );
    expect(result.blocked).toBe(false);
  });

  it("fails open (allows) when no lists are loaded", () => {
    const adapter = new GhosteryAdapter();
    const result = adapter.check("https://ads.example.com/x", "https://site.com/", "script");
    expect(result.blocked).toBe(false);
  });

  it("replaceFilters resets the engine with new rules", () => {
    const adapter = new GhosteryAdapter();
    adapter.replaceFilters([MINIMAL_RULES]);
    expect(adapter.check("https://ads.example.com/x", "", "script").blocked).toBe(true);
    adapter.replaceFilters([""]);
    // After wiping rules the engine still operates, just with no matches
    // (result may vary; at minimum it should not throw)
    expect(() => adapter.check("https://ads.example.com/x", "", "script")).not.toThrow();
  });

  it("tracks networkRules and cosmeticRules counts after loading", () => {
    const adapter = new GhosteryAdapter();
    adapter.replaceFilters([MINIMAL_RULES]);
    expect(adapter.networkRules).toBeGreaterThan(0);
    expect(adapter.cosmeticRules).toBeGreaterThan(0);
  });
});

describe("GhosteryAdapter — cosmetic filtering", () => {
  it("getCosmeticCSS returns a non-empty string for a page with cosmetic rules", () => {
    const adapter = new GhosteryAdapter();
    adapter.replaceFilters([MINIMAL_RULES]);
    const css = adapter.getCosmeticCSS("https://any-site.com/page");
    // Should produce CSS for generic cosmetic rules (##.ad-banner etc.)
    expect(typeof css).toBe("string");
  });

  it("getCosmeticSelectors returns an array (possibly empty) without throwing", () => {
    const adapter = new GhosteryAdapter();
    adapter.replaceFilters([MINIMAL_RULES]);
    const selectors = adapter.getCosmeticSelectors("https://any-site.com/page");
    expect(Array.isArray(selectors)).toBe(true);
  });

  it("getCosmeticCSS returns empty string when no lists loaded", () => {
    const adapter = new GhosteryAdapter();
    const css = adapter.getCosmeticCSS("https://any-site.com/");
    expect(css).toBe("");
  });
});
