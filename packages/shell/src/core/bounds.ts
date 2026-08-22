import { CHROME_HEIGHT } from "@mine/contracts";

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
    width: windowWidth,
    height: Math.max(0, windowHeight - CHROME_HEIGHT),
  };
}
