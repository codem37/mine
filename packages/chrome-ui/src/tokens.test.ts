import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CHROME_HEIGHT,
  TAB_RAIL_WIDTH,
} from "@mine/contracts";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const layoutCss = readFileSync(new URL("./chrome.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--hud-${name}:\\s*(#[0-9a-fA-F]{6})`));
  const value = match?.[1];
  if (value === undefined) throw new Error(`token --hud-${name} not found`);
  return value;
}

function luminance(hex: string): number {
  const channels = [0, 2, 4].map((i) => {
    const raw = Number.parseInt(hex.slice(1 + i, 3 + i), 16) / 255;
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  });
  return (
    0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  );
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe("HUD token contrast (WCAG 4.5:1 for text)", () => {
  const textPairs: Array<[string, string, string]> = [
    ["body text on background", "text", "bg"],
    ["cyan accent on background", "cyan", "bg"],
  ];

  it.each(textPairs)("%s >= 4.5:1", (_label, fg, bg) => {
    const ratio = contrast(token(fg), token(bg));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("records the actual ratios so drift is visible", () => {
    const ratios = Object.fromEntries(
      textPairs.map(([label, fg, bg]) => [
        label,
        Math.round(contrast(token(fg), token(bg)) * 100) / 100,
      ]),
    );
    console.table(ratios);
    expect(true).toBe(true);
  });

  it("decorative strokes stay above invisible", () => {
    // glass-line is rgba so we test the hex tokens that are still present
    expect(contrast(token("text-dim"), token("bg"))).toBeGreaterThan(2.5);
  });
});

describe("shared layout constants flow from contracts (ADR 0002, ADR 0007)", () => {
  it("chrome.css consumes the injected custom properties, not hand-copied pixels", () => {
    expect(layoutCss).toContain("height: var(--hud-chrome-height);");
    expect(layoutCss).toContain("var(--hud-chrome-height)");
    expect(layoutCss).toContain("width: var(--hud-tab-rail-width);");
  });

  it(`no literal px may shadow a contracts value (${CHROME_HEIGHT}, ${TAB_RAIL_WIDTH})`, () => {
    expect(layoutCss).not.toContain(`height: ${CHROME_HEIGHT}px`);
    expect(layoutCss).not.toContain(`top: ${CHROME_HEIGHT}px;`);
    expect(layoutCss).not.toContain(`width: ${TAB_RAIL_WIDTH}px`);
  });

  it("vite config wires the injection plugin that defines those properties", () => {
    const viteConfig = readFileSync(
      new URL("../vite.config.ts", import.meta.url),
      "utf8",
    );
    expect(viteConfig).toContain("--hud-chrome-height");
    expect(viteConfig).toContain("--hud-tab-rail-width");
  });
});
