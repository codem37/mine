import type { TabId } from "./tab.js";

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly accent: string;
  readonly tabIds: readonly TabId[];
  readonly activeTabId: TabId | null;
}

export interface TabGroup {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly tabIds: readonly TabId[];
  readonly collapsed: boolean;
}

export interface CommandItem {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly shortcut?: string;
  readonly action: string;
  readonly icon?: string;
}
