import { CHROME_HEIGHT, TELEMETRY_RAIL_WIDTH } from "@mine/contracts";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function contentBounds(
  windowWidth: number,
  windowHeight: number,
): Rect {
  return {
    x: 0,
    y: CHROME_HEIGHT,
    width: Math.max(0, windowWidth - TELEMETRY_RAIL_WIDTH),
    height: Math.max(0, windowHeight - CHROME_HEIGHT),
  };
}
