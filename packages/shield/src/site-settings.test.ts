import { describe, expect, it } from "vitest";
import { SiteSettingsStore } from "./site-settings.js";

describe("SiteSettingsStore", () => {
  it("returns secure defaults for unknown domains", () => {
    const store = new SiteSettingsStore();
    const s = store.get("example.com");
    expect(s.adsBlocked).toBe(true);
    expect(s.trackersBlocked).toBe(true);
    expect(s.cosmeticsEnabled).toBe(true);
    expect(s.allowlisted).toBe(false);
  });

  it("merges partial updates, preserving unspecified fields", () => {
    const store = new SiteSettingsStore();
    store.set("example.com", { adsBlocked: false });
    const s = store.get("example.com");
    expect(s.adsBlocked).toBe(false);
    expect(s.trackersBlocked).toBe(true); // unchanged
    expect(s.allowlisted).toBe(false);    // unchanged
  });

  it("isAllowlisted returns false by default and true after set", () => {
    const store = new SiteSettingsStore();
    expect(store.isAllowlisted("foo.com")).toBe(false);
    store.set("foo.com", { allowlisted: true });
    expect(store.isAllowlisted("foo.com")).toBe(true);
  });

  it("normalizes www. prefix for consistent domain keying", () => {
    const store = new SiteSettingsStore();
    store.set("www.example.com", { allowlisted: true });
    expect(store.isAllowlisted("example.com")).toBe(true);
    expect(store.isAllowlisted("www.example.com")).toBe(true);
  });

  it("isActive returns false when allowlisted", () => {
    const store = new SiteSettingsStore();
    store.set("site.com", { allowlisted: true });
    expect(store.isActive("site.com")).toBe(false);
  });

  it("isActive returns true by default", () => {
    const store = new SiteSettingsStore();
    expect(store.isActive("any.com")).toBe(true);
  });

  it("reset removes custom settings for a domain", () => {
    const store = new SiteSettingsStore();
    store.set("reset.com", { adsBlocked: false, allowlisted: true });
    store.reset("reset.com");
    const s = store.get("reset.com");
    expect(s.adsBlocked).toBe(true);  // back to default
    expect(s.allowlisted).toBe(false); // back to default
  });

  it("configuredDomains lists only explicitly set domains", () => {
    const store = new SiteSettingsStore();
    store.set("a.com", { adsBlocked: false });
    store.set("b.com", { trackersBlocked: false });
    expect(store.configuredDomains().sort()).toEqual(["a.com", "b.com"]);
  });
});
