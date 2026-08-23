import { ipcMain } from "electron";
import {
  AddDownloadRequestSchema,
  AddExceptionRequestSchema,
  DeleteFileRequestSchema,
  DownloadIdRequestSchema,
  IPC_CHANNELS,
  LoadSubtitleRequestSchema,
  MediaControlRequestSchema,
  MediaItemDownloadRequestSchema,
  NavigateRequestSchema,
  NewTabRequestSchema,
  PinRequestSchema,
  PlayNativeRequestSchema,
  SearchRequestSchema,
  SetShieldEnabledRequestSchema,
  ShieldStatsSchema,
  SuggestRequestSchema,
  TabIdRequestSchema,
  TabsUpdatedPayloadSchema,
  UnitRequestSchema,
} from "@mine/contracts";
import type { TabManager } from "./tab-manager.js";
import { parsePayload } from "./core/ipc-parse.js";

export interface IpcDeps {
  readonly currentShieldStats: () => unknown;
  readonly setShieldEnabled: (enabled: boolean) => void;
  readonly currentDownloads?: () => unknown[];
  readonly onDownloadAction?: (action: string, param1: string, param2?: unknown) => void;
  readonly currentMediaStreams?: () => unknown[];
  readonly onMediaAction?: (action: string, param1: string, param2?: unknown) => void;
  readonly getMediaState?: () => unknown;
  readonly onMediaControl?: (action: string, value?: unknown) => void;
  readonly onSearchQuery?: (req: import("@mine/contracts").SearchRequest) => Promise<unknown>;
  readonly onSearchSuggest?: (query: string, isPrivate?: boolean) => unknown;
  readonly getSecurityVerdict?: (url: string) => unknown;
  readonly getProtectionCenterStats?: () => unknown;
  readonly addSafetyException?: (domain: string, durationMinutes?: number) => void;
  readonly getSecurityEvents?: () => unknown;
  readonly resolveProtocolUrl?: (url: string) => Promise<unknown>;
  readonly getProtocolInfo?: (url: string) => Promise<unknown>;
  readonly pinIpfsCid?: (cid: string) => void;
  readonly unpinIpfsCid?: (cid: string) => void;
  readonly clearIpfsCache?: () => void;
  readonly getIpfsStorageStats?: () => unknown;
}

export function registerIpcHandlers(
  manager: TabManager,
  win: Electron.BrowserWindow,
  deps: IpcDeps,
): void {
  const unitHandlers: Record<string, () => void> = {
    [IPC_CHANNELS.shell.minimizeWindow]: () => win.minimize(),
    [IPC_CHANNELS.shell.toggleMaximizeWindow]: () => {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    },
    [IPC_CHANNELS.shell.closeWindow]: () => win.close(),
  };
  for (const [channel, action] of Object.entries(unitHandlers)) {
    ipcMain.handle(channel, async (_event, raw: unknown) => {
      const payload = parsePayload(UnitRequestSchema, raw);
      if (!payload.ok) return payload;
      action();
      return { ok: true, value: null } as const;
    });
  }

  ipcMain.handle(
    IPC_CHANNELS.shell.navigate,
    async (_event, raw: unknown) => {
      const payload = parsePayload(NavigateRequestSchema, raw);
      return payload.ok
        ? manager.navigate(payload.value.tabId, payload.value.url)
        : payload;
    },
  );

  ipcMain.handle(IPC_CHANNELS.shell.newTab, async (_event, raw: unknown) => {
    const payload = parsePayload(NewTabRequestSchema, raw);
    return payload.ok ? manager.createTab(payload.value.url) : payload;
  });

  ipcMain.handle(IPC_CHANNELS.shell.closeTab, async (_event, raw: unknown) => {
    const payload = parsePayload(TabIdRequestSchema, raw);
    return payload.ok ? manager.closeTab(payload.value.tabId) : payload;
  });

  ipcMain.handle(
    IPC_CHANNELS.shell.activateTab,
    async (_event, raw: unknown) => {
      const payload = parsePayload(TabIdRequestSchema, raw);
      return payload.ok ? manager.activateTab(payload.value.tabId) : payload;
    },
  );

  ipcMain.handle(IPC_CHANNELS.shell.goBack, async (_event, raw: unknown) => {
    const payload = parsePayload(TabIdRequestSchema, raw);
    return payload.ok ? manager.goBack(payload.value.tabId) : payload;
  });

  ipcMain.handle(
    IPC_CHANNELS.shell.goForward,
    async (_event, raw: unknown) => {
      const payload = parsePayload(TabIdRequestSchema, raw);
      return payload.ok ? manager.goForward(payload.value.tabId) : payload;
    },
  );

  ipcMain.handle(IPC_CHANNELS.shell.reload, async (_event, raw: unknown) => {
    const payload = parsePayload(TabIdRequestSchema, raw);
    return payload.ok ? manager.reload(payload.value.tabId) : payload;
  });

  ipcMain.handle(IPC_CHANNELS.shell.stop, async (_event, raw: unknown) => {
    const payload = parsePayload(TabIdRequestSchema, raw);
    return payload.ok ? manager.stop(payload.value.tabId) : payload;
  });

  ipcMain.handle(IPC_CHANNELS.shell.getTabs, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    return parsePayload(TabsUpdatedPayloadSchema, manager.snapshot());
  });

  ipcMain.handle(
    IPC_CHANNELS.shield.getStats,
    async (_event, raw: unknown) => {
      const payload = parsePayload(UnitRequestSchema, raw);
      if (!payload.ok) return payload;
      return parsePayload(ShieldStatsSchema, deps.currentShieldStats());
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.shield.setEnabled,
    async (_event, raw: unknown) => {
      const payload = parsePayload(SetShieldEnabledRequestSchema, raw);
      if (!payload.ok) return payload;
      deps.setShieldEnabled(payload.value.enabled);
      return parsePayload(ShieldStatsSchema, deps.currentShieldStats());
    },
  );

  // Fetcher / Downloads Handlers
  ipcMain.handle(IPC_CHANNELS.fetcher.getDownloads, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    return { ok: true, value: deps.currentDownloads?.() ?? [] } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.pauseDownload, async (_event, raw: unknown) => {
    const payload = parsePayload(DownloadIdRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("pause", payload.value.downloadId);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.resumeDownload, async (_event, raw: unknown) => {
    const payload = parsePayload(DownloadIdRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("resume", payload.value.downloadId);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.cancelDownload, async (_event, raw: unknown) => {
    const payload = parsePayload(DownloadIdRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("cancel", payload.value.downloadId);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.retryDownload, async (_event, raw: unknown) => {
    const payload = parsePayload(DownloadIdRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("retry", payload.value.downloadId);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.addDownload, async (_event, raw: unknown) => {
    const payload = parsePayload(AddDownloadRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("add", payload.value.url, payload.value.savePath);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.removeDownload, async (_event, raw: unknown) => {
    const payload = parsePayload(DownloadIdRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("remove", payload.value.downloadId);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.deleteFile, async (_event, raw: unknown) => {
    const payload = parsePayload(DeleteFileRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("deleteFile", payload.value.downloadId, payload.value.deleteFromDisk);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.openFile, async (_event, raw: unknown) => {
    const payload = parsePayload(DownloadIdRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("openFile", payload.value.downloadId);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.fetcher.showInFolder, async (_event, raw: unknown) => {
    const payload = parsePayload(DownloadIdRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onDownloadAction?.("showInFolder", payload.value.downloadId);
    return { ok: true, value: null } as const;
  });

  // Media Handlers
  ipcMain.handle(IPC_CHANNELS.media.getDetectedStreams, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    return { ok: true, value: deps.currentMediaStreams?.() ?? [] } as const;
  });

  ipcMain.handle(IPC_CHANNELS.media.playNative, async (_event, raw: unknown) => {
    const payload = parsePayload(PlayNativeRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onMediaAction?.("playNative", payload.value.url, payload.value.title);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.media.getState, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    return { ok: true, value: deps.getMediaState?.() ?? null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.media.control, async (_event, raw: unknown) => {
    const payload = parsePayload(MediaControlRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.onMediaControl?.(payload.value.action, payload.value.value);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.media.downloadSource, async (_event, raw: unknown) => {
    const payload = parsePayload(MediaItemDownloadRequestSchema, raw);
    if (!payload.ok) return payload;
    // Direct handoff to Phase 4 Fetcher
    deps.onDownloadAction?.("add", payload.value.url, payload.value.title);
    return { ok: true, value: null } as const;
  });

  // Search Handlers
  ipcMain.handle(IPC_CHANNELS.search.query, async (_event, raw: unknown) => {
    const payload = parsePayload(SearchRequestSchema, raw);
    if (!payload.ok) return payload;
    if (deps.onSearchQuery) {
      const res = await deps.onSearchQuery(payload.value);
      return { ok: true, value: res } as const;
    }
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.search.suggest, async (_event, raw: unknown) => {
    const payload = parsePayload(SuggestRequestSchema, raw);
    if (!payload.ok) return payload;
    const items = deps.onSearchSuggest?.(payload.value.query, payload.value.isPrivate) ?? [];
    return { ok: true, value: { query: payload.value.query, suggestions: items } } as const;
  });

  // Safety Handlers
  ipcMain.handle(IPC_CHANNELS.safety.getVerdict, async (_event, raw: unknown) => {
    const payload = parsePayload(NavigateRequestSchema, raw);
    if (!payload.ok) return payload;
    return { ok: true, value: deps.getSecurityVerdict?.(payload.value.url) ?? null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.safety.getProtectionStats, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    return { ok: true, value: deps.getProtectionCenterStats?.() ?? null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.safety.addException, async (_event, raw: unknown) => {
    const payload = parsePayload(AddExceptionRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.addSafetyException?.(payload.value.domain, payload.value.durationMinutes);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.safety.getEvents, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    return { ok: true, value: deps.getSecurityEvents?.() ?? [] } as const;
  });

  // Protocol Handlers
  ipcMain.handle(IPC_CHANNELS.protocol.resolve, async (_event, raw: unknown) => {
    const payload = parsePayload(NavigateRequestSchema, raw);
    if (!payload.ok) return payload;
    const res = await deps.resolveProtocolUrl?.(payload.value.url);
    return { ok: true, value: res ?? null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.protocol.getInfo, async (_event, raw: unknown) => {
    const payload = parsePayload(NavigateRequestSchema, raw);
    if (!payload.ok) return payload;
    const res = await deps.getProtocolInfo?.(payload.value.url);
    return { ok: true, value: res ?? null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.protocol.pin, async (_event, raw: unknown) => {
    const payload = parsePayload(PinRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.pinIpfsCid?.(payload.value.cid);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.protocol.unpin, async (_event, raw: unknown) => {
    const payload = parsePayload(PinRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.unpinIpfsCid?.(payload.value.cid);
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.protocol.clearCache, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    deps.clearIpfsCache?.();
    return { ok: true, value: null } as const;
  });

  ipcMain.handle(IPC_CHANNELS.protocol.getStorage, async (_event, raw: unknown) => {
    const payload = parsePayload(UnitRequestSchema, raw);
    if (!payload.ok) return payload;
    return { ok: true, value: deps.getIpfsStorageStats?.() ?? null } as const;
  });
}
