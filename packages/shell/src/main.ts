import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import { IPC_EVENTS } from "@mine/contracts";
import { ShieldStatsSchema, WindowStateSchema } from "@mine/contracts";
import { stripTrackingParams } from "@mine/shield";
import { TabManager } from "./tab-manager.js";
import type { HistoryEntry } from "./tab-manager.js";
import {
  attachChromeProtocol,
  chromeAssetRoot,
  declarePrivilegedScheme,
} from "./protocol.js";
import { defaultSession, registerSessionHook } from "./sessions.js";
import { registerIpcHandlers } from "./ipc.js";
import { createShieldBridge } from "./shield-bridge.js";
import { TelemetrySampler } from "./telemetry.js";

declarePrivilegedScheme();

const history: HistoryEntry[] = [];
let manager: TabManager | null = null;
let mainWindow: BrowserWindow | null = null;

function emitWindowState(): void {
  if (mainWindow === null || mainWindow.isDestroyed()) return;
  const payload = WindowStateSchema.parse({
    maximized: mainWindow.isMaximized(),
  });
  mainWindow.webContents.send(IPC_EVENTS.shell.windowStateChanged, payload);
}

function bootstrap(): void {
  const bridge = createShieldBridge();
  registerSessionHook(bridge.hookSession);
  defaultSession().setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
  attachChromeProtocol(defaultSession(), chromeAssetRoot());

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: fileURLToPath(new URL("./preload.cjs", import.meta.url)),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow = win;

  manager = new TabManager(
    win,
    () => {
      if (!win.isDestroyed() && manager !== null) {
        win.webContents.send(IPC_EVENTS.shell.tabsUpdated, manager.snapshot());
      }
    },
    history,
    {
      stripParams: stripTrackingParams,
      internalPreloadPath: fileURLToPath(
        new URL("./preload.cjs", import.meta.url),
      ),
    },
  );
  registerIpcHandlers(manager, win);

  win.on("maximize", emitWindowState);
  win.on("unmaximize", emitWindowState);
  win.on("restore", emitWindowState);
  win.webContents.on("did-finish-load", emitWindowState);

  const sampler = new TelemetrySampler(
    (snapshot) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_EVENTS.shell.telemetryUpdated, snapshot);
      }
    },
    () => bridge.requestRate.inLastMinute(),
  );
  sampler.start();
  app.on("before-quit", () => sampler.stop());

  bridge.setEmitter((signal) => {
    const tabId =
      signal.webContentsId === null
        ? null
        : (manager?.ownerOf(signal.webContentsId) ?? null);
    if (win.isDestroyed()) return;
    const payload = ShieldStatsSchema.parse({
      tabId,
      blockedCount: bridge.counts.total,
      engineState: bridge.engine.state,
    });
    win.webContents.send(IPC_EVENTS.shield.statsUpdated, payload);
  });
  void bridge.start();

  win.on("resize", () => manager?.layout());
  win.on("maximize", () => manager?.layout());
  win.on("unmaximize", () => manager?.layout());

  void win.loadURL("mine://chrome/");
  void manager.createTab();
}

app.whenReady().then(() => {
  bootstrap();
});

app.on("window-all-closed", () => {
  app.quit();
});
