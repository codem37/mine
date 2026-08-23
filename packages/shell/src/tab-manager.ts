import { WebContentsView } from "electron";
import {
  buildSitePartition,
  err,
  ok,
} from "@mine/contracts";
import type {
  AppError,
  LoadState,
  Result,
  TabId,
  TabSnapshot,
  TabsUpdatedPayload,
} from "@mine/contracts";
import { contentBounds } from "./core/bounds.js";
import { toLoadState, type TabEventName } from "./core/load-state.js";
import { sessionForPartitionName, defaultSession } from "./sessions.js";
import { DOM_MEDIA_OBSERVER_SCRIPT } from "./dom-media-observer.js";

export const NEW_TAB_URL = "mine://newtab/";
const ALLOWED_SCHEMES = new Set(["http:", "https:", "mine:"]);
const HISTORY_LIMIT = 1000;

interface InternalTab {
  id: TabId;
  view: WebContentsView;
  partitionName: string | null;
  loadState: LoadState;
  errorCode?: number;
  favicons?: string[];
}

export interface HistoryEntry {
  readonly url: string;
  readonly title: string;
  readonly visitedAt: number;
}

function partitionFor(url: URL): Result<string | null, AppError> {
  if (url.protocol === "http:" || url.protocol === "https:") {
    return buildSitePartition(url.hostname);
  }
  return ok(null);
}

export interface TabManagerOptions {
  readonly stripParams?: (urlString: string) => string;
  readonly internalPreloadPath?: string;
}

export class TabManager {
  private readonly tabs = new Map<TabId, InternalTab>();
  private readonly order: TabId[] = [];
  private activeId: TabId | null = null;
  private nextId = 0;

  constructor(
    private readonly window: Electron.BrowserWindow,
    private readonly notify: () => void,
    private readonly history: HistoryEntry[] = [],
    private readonly options: TabManagerOptions = {},
  ) {}

  ownerOf(webContentsId: number): TabId | null {
    for (const [id, tab] of this.tabs) {
      if (tab.view.webContents.id === webContentsId) return id;
    }
    return null;
  }

  ownerHandle(id: TabId): Electron.WebContents | undefined {
    return this.tabs.get(id)?.view.webContents;
  }

  snapshot(): TabsUpdatedPayload {
    const tabs: TabSnapshot[] = [];
    for (const id of this.order) {
      const tab = this.tabs.get(id);
      if (tab === undefined) continue;
      tabs.push(this.snapshotOf(tab));
    }
    return { tabs, activeTabId: this.activeId };
  }

  createTab(initialUrl?: string): Result<{ id: TabId }, AppError> {
    const target = initialUrl ?? NEW_TAB_URL;
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return err({ kind: "invalid-input", message: `not a url: ${target}` });
    }
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      return err({
        kind: "unsupported",
        message: `scheme not allowed in phase 1: ${parsed.protocol}`,
        details: { scheme: parsed.protocol },
      });
    }
    const partition = partitionFor(parsed);
    if (!partition.ok) return partition;

    const id: TabId = `tab-${this.nextId++}`;
    const view = this.createView(partition.value, parsed.protocol === "mine:");
    const tab: InternalTab = {
      id,
      view,
      partitionName: partition.value,
      loadState: "idle",
    };
    this.tabs.set(id, tab);
    this.order.push(id);
    this.bindEvents(tab);
    this.window.contentView.addChildView(view);
    this.activateTab(id);
    void tab.view.webContents.loadURL(target).catch(() => {});
    this.notify();
    return ok({ id });
  }

  closeTab(id: TabId): Result<null, AppError> {
    const tab = this.tabs.get(id);
    if (tab === undefined) {
      return err({ kind: "invalid-input", message: `unknown tab: ${id}` });
    }
    const index = this.order.indexOf(id);
    this.order.splice(index, 1);
    this.tabs.delete(id);
    this.window.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
    if (this.activeId === id) {
      this.activeId = null;
      const neighbour = this.order[Math.min(index, this.order.length - 1)];
      if (neighbour !== undefined) {
        this.activateTab(neighbour);
      }
    }
    this.notify();
    return ok(null);
  }

  activateTab(id: TabId): Result<null, AppError> {
    const tab = this.tabs.get(id);
    if (tab === undefined) {
      return err({ kind: "invalid-input", message: `unknown tab: ${id}` });
    }
    this.activeId = id;
    const index = this.order.indexOf(id);
    this.order.splice(index, 1);
    this.order.push(id);
    this.applyLayout();
    this.notify();
    return ok(null);
  }

  navigate(id: TabId, urlString: string): Result<null, AppError> {
    const tab = this.tabs.get(id);
    if (tab === undefined) {
      return err({ kind: "invalid-input", message: `unknown tab: ${id}` });
    }
    const stripped = this.options.stripParams?.(urlString) ?? urlString;
    let parsed: URL;
    try {
      parsed = new URL(stripped);
    } catch {
      return err({ kind: "invalid-input", message: `not a url: ${stripped}` });
    }
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      return err({
        kind: "unsupported",
        message: `scheme not allowed in phase 1: ${parsed.protocol}`,
        details: { scheme: parsed.protocol },
      });
    }
    const partition = partitionFor(parsed);
    if (!partition.ok) return partition;
    if (partition.value !== tab.partitionName) {
      this.swapSessionView(tab, partition.value);
    }
    tab.favicons = [];
    tab.loadState = "started";
    delete tab.errorCode;
    void tab.view.webContents.loadURL(parsed.toString()).catch(() => {});
    this.notify();
    return ok(null);
  }

  goBack(id: TabId): Result<null, AppError> {
    return this.simpleNavigation(id, (wc) => wc.goBack());
  }

  goForward(id: TabId): Result<null, AppError> {
    return this.simpleNavigation(id, (wc) => wc.goForward());
  }

  reload(id: TabId): Result<null, AppError> {
    return this.simpleNavigation(id, (wc) => wc.reload());
  }

  stop(id: TabId): Result<null, AppError> {
    return this.simpleNavigation(id, (wc) => wc.stop());
  }

  layout(): void {
    this.applyLayout();
  }

  dispose(): void {
    for (const tab of this.tabs.values()) {
      tab.view.webContents.close();
    }
    this.tabs.clear();
    this.order.length = 0;
    this.activeId = null;
  }

  private simpleNavigation(
    id: TabId,
    action: (wc: Electron.WebContents) => void,
  ): Result<null, AppError> {
    const tab = this.tabs.get(id);
    if (tab === undefined) {
      return err({ kind: "invalid-input", message: `unknown tab: ${id}` });
    }
    action(tab.view.webContents);
    this.notify();
    return ok(null);
  }

  private createView(
    partitionName: string | null,
    includePreload: boolean,
  ): WebContentsView {
    const preload =
      includePreload === true
        ? (this.options.internalPreloadPath ?? undefined)
        : undefined;
    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        session:
          partitionName === null
            ? defaultSession()
            : sessionForPartitionName(partitionName),
        ...(preload === undefined ? {} : { preload }),
      },
    });
    view.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    return view;
  }

  private swapSessionView(
    tab: InternalTab,
    partitionName: string | null,
  ): void {
    const old = tab.view;
    const wasActive = tab.id === this.activeId;
    const bounds = { ...old.getBounds() };
    this.window.contentView.removeChildView(old);
    old.webContents.close();
    const view = this.createView(partitionName, false);
    tab.view = view;
    tab.partitionName = partitionName;
    tab.loadState = "idle";
    delete tab.errorCode;
    this.window.contentView.addChildView(view);
    if (wasActive) {
      this.activeId = null;
      void this.activateTab(tab.id);
    }
    view.setBounds(bounds);
    this.bindEvents(tab);
  }

  private bindEvents(tab: InternalTab): void {
    const wc = tab.view.webContents;
    const injectMediaObserver = () => {
      try {
        void wc.executeJavaScript(DOM_MEDIA_OBSERVER_SCRIPT);
      } catch {
        // ignore
      }
    };
    const set = (event: TabEventName, errorCode?: number) => {
      tab.loadState = toLoadState(event);
      if (errorCode === undefined) {
        delete tab.errorCode;
      } else {
        tab.errorCode = errorCode;
      }
      this.notify();
    };
    wc.on("did-start-loading", () => set("start"));
    wc.on("did-navigate", (_e, url) => {
      set("navigate");
      this.pushHistory(url, wc.getTitle());
    });
    wc.on("did-navigate-in-page", () => {
      set("in-page");
      injectMediaObserver();
    });
    wc.on("dom-ready", () => {
      set("dom-ready");
      injectMediaObserver();
    });
    wc.on("did-finish-load", () => {
      set("finish");
      injectMediaObserver();
    });
    wc.on("did-fail-load", (_e, errorCode, _desc, _validatedURL, isMainFrame) => {
      if (isMainFrame && errorCode !== undefined && errorCode !== -3) {
        set("fail", errorCode);
      }
    });
    wc.on("page-title-updated", () => this.notify());
    wc.on("page-favicon-updated", (_e, favicons) => {
      tab.favicons = favicons;
      this.notify();
    });
  }

  private pushHistory(url: string, title: string): void {
    if (!url.startsWith("http")) return;
    this.history.push({ url, title, visitedAt: Date.now() });
    if (this.history.length > HISTORY_LIMIT) {
      this.history.shift();
    }
  }

  private overlayActive = false;

  setOverlayActive(active: boolean): void {
    if (this.overlayActive === active) return;
    this.overlayActive = active;
    this.applyLayout();
  }

  private applyLayout(): void {
    const [width, height] = this.window.getSize();
    const bounds = contentBounds(width ?? 800, height ?? 600);
    for (const id of this.order) {
      const tab = this.tabs.get(id);
      if (tab === undefined) continue;
      tab.view.setBounds(bounds);
      if (id !== this.activeId || this.overlayActive) {
        try {
          this.window.contentView.removeChildView(tab.view);
        } catch {
          // ignore
        }
      }
    }
    const active = this.activeId === null ? undefined : this.tabs.get(this.activeId);
    if (active !== undefined && !this.overlayActive) {
      try {
        this.window.contentView.removeChildView(active.view);
        this.window.contentView.addChildView(active.view);
        active.view.setBounds(bounds);
      } catch {
        // ignore
      }
    }
  }

  private snapshotOf(tab: InternalTab): TabSnapshot {
    const wc = tab.view.webContents;
    return {
      id: tab.id,
      url: wc.getURL() || NEW_TAB_URL,
      title: wc.getTitle() || wc.getURL(),
      favicons:
        tab.favicons !== undefined && tab.favicons.length > 0
          ? tab.favicons
          : undefined,
      loadState: tab.loadState,
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
    };
  }
}
