import type { LoadState } from "./navigation.js";

export type TabId = string;

export interface TabSnapshot {
  readonly id: TabId;
  readonly url: string;
  readonly title: string;
  readonly loadState: LoadState;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}
