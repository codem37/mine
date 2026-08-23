import { ipcMain } from "electron";
import {
  DownloadIdRequestSchema,
  IPC_CHANNELS,
  NavigateRequestSchema,
  NewTabRequestSchema,
  SetShieldEnabledRequestSchema,
  ShieldStatsSchema,
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
  readonly onDownloadAction?: (action: string, id: string) => void;
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
}
