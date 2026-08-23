import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WindowControls } from "./WindowControls.js";

describe("WindowControls component", () => {
  it("renders minimize, maximize, and close buttons with aria-labels and titles", () => {
    const html = renderToStaticMarkup(<WindowControls maximized={false} />);
    expect(html).toContain('aria-label="minimize window"');
    expect(html).toContain('title="Minimize"');
    expect(html).toContain('aria-label="maximize window"');
    expect(html).toContain('title="Maximize"');
    expect(html).toContain('aria-label="close window"');
    expect(html).toContain('title="Close"');
  });

  it("swaps maximize glyph and title to restore when window is maximized", () => {
    const notMaxHtml = renderToStaticMarkup(<WindowControls maximized={false} />);
    expect(notMaxHtml).toContain("\u25A1");
    expect(notMaxHtml).toContain('title="Maximize"');

    const maxHtml = renderToStaticMarkup(<WindowControls maximized={true} />);
    expect(maxHtml).toContain("\u2750");
    expect(maxHtml).toContain('title="Restore"');
    expect(maxHtml).toContain('aria-label="restore window"');
  });

  it("all window control buttons have type=button", () => {
    const html = renderToStaticMarkup(<WindowControls maximized={false} />);
    const buttons = html.match(/type="button"/g);
    expect(buttons?.length).toBe(3);
  });
});
