import { CHROME_HEIGHT, TAB_RAIL_WIDTH } from "@mine/contracts";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// Content sits between the left tab rail and the top chrome bar.
// The right edge extends to the window boundary (no right rail).
// All widths come from contracts so the renderer and these bounds
// cannot drift apart.
export function contentBounds(
  windowWidth: number,
  windowHeight: number,
): Rect {
  return {
    x: TAB_RAIL_WIDTH,
    y: CHROME_HEIGHT,
    width: Math.max(0, windowWidth - TAB_RAIL_WIDTH),
    height: Math.max(0, windowHeight - CHROME_HEIGHT),
  };
}
