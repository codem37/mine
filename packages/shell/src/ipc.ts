import { ipcMain } from "electron";
import {
  IPC_CHANNELS,
  NavigateRequestSchema,
  NewTabRequestSchema,
  TabIdRequestSchema,
  UnitRequestSchema,
} from "@mine/contracts";
import type { TabManager } from "./tab-manager.js";
import { parsePayload } from "./core/ipc-parse.js";

export function registerIpcHandlers(
  manager: TabManager,
  win: Electron.BrowserWindow,
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
}
