import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function src(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

const AUDITED = [
  ["dashboard", "../newtab.tsx"],
  ["tab strip", "../components/TabStrip.tsx"],
  ["window controls", "../components/WindowControls.tsx"],
  ["app shell", "../App.tsx"],
] as const;

// Status strings that once appeared as hardcoded placeholders. If a real
// source exists they must be computed, never spelled out in a component.
const BANNED_STATUS_LITERALS = [
  '"n/a"',
  '"N/A"',
  '"P4"',
  '"P6"',
  '"P7"',
  '"P8"',
  "?? 0",
] as const;

describe("honest rendering: no hardcoded status strings (CLAUDE.md rule 7)", () => {
  it.each(AUDITED)("%s contains no banned status literals", (_name, rel) => {
    const code = src(rel);
    for (const literal of BANNED_STATUS_LITERALS) {
      expect(code, `${rel} must not contain ${literal}`).not.toContain(literal);
    }
  });

  it("phase labels on future nodes were replaced by the honest planned state", () => {
    const dash = src("../newtab.tsx");
    expect(dash).toContain('PLANNED_LABEL = "planned"');
    expect(dash).not.toContain("phase:");
  });

  it("a null stat renders pending through StatNode, not an invented value", () => {
    const statNode = src("../components/StatNode.tsx");
    expect(statNode).toContain("value === null");
    expect(statNode).toContain("STAT_PENDING");
  });
});

describe("one reusable stat component serves the dashboard", () => {
  it("newtab dashboard is fed by StatNode", () => {
    expect(src("../newtab.tsx")).toContain("StatNode");
  });

  it("StatNode is prop-driven: no IPC access inside the component", () => {
    const statNode = src("../components/StatNode.tsx");
    expect(statNode).not.toContain("window.mine");
    expect(statNode).not.toContain("useEffect");
  });

  it("the live stats hook is the single subscription path", () => {
    const app = src("../App.tsx");
    expect(app).toContain("useLiveStats");
    expect(app).not.toContain("onTabsUpdated");
    expect(app).not.toContain("onShieldStats");
  });
});

describe("motion respects prefers-reduced-motion", () => {
  it("tokens.css clamps both duration and iteration count globally", () => {
    const tokens = src("../../src/tokens.css");
    expect(tokens).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(tokens).toContain("animation-duration");
    expect(tokens).toContain("animation-iteration-count: 1");
  });

  it("chrome.css and dash.css carry local guards for what they animate", () => {
    expect(src("../../src/chrome.css")).toMatch(
      /@media \(prefers-reduced-motion: reduce\)/,
    );
    const dash = src("../../src/dash.css");
    expect(dash).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(dash).toContain(".dash__node:hover circle");
  });
});
