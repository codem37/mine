import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSafe } from "./protocol-path.js";

const ROOT = path.resolve(path.sep, "srv", "chrome");

describe("resolveSafe", () => {
  it("resolves a plain relative path inside the root", () => {
    const r = resolveSafe(ROOT, "index.html");
    expect(r).not.toBeNull();
    expect(path.relative(ROOT, r as string)).toBe("index.html");
  });

  it("rejects parent traversal", () => {
    expect(resolveSafe(ROOT, "../secrets.txt")).toBeNull();
    expect(resolveSafe(ROOT, "a/../../secrets.txt")).toBeNull();
  });

  it("rejects encoded traversal before resolving", () => {
    expect(resolveSafe(ROOT, "%2e%2e/secrets.txt")).toBeNull();
    expect(resolveSafe(ROOT, "a/%2e%2e/%2e%2e/secrets.txt")).toBeNull();
  });

  it("collapses benign nested paths that stay inside the root", () => {
    const r = resolveSafe(ROOT, "assets/./app.js");
    expect(r).not.toBeNull();
  });
});
