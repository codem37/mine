export const LOAD_STATES = [
  "idle",
  "started",
  "committed",
  "dom-ready",
  "loaded",
  "failed",
] as const;

export type LoadState = (typeof LOAD_STATES)[number];

export interface NavigationState {
  readonly url: string;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly loadState: LoadState;
  readonly errorCode?: number;
}
