import { app, BrowserWindow, shell } from "electron";
import { fileURLToPath } from "node:url";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { IPC_EVENTS } from "@mine/contracts";
import { ShieldStatsSchema, WindowStateSchema } from "@mine/contracts";
import { stripTrackingParams } from "@mine/shield";
import { DownloadEngine } from "@mine/fetcher";
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
let bridgeRef: ReturnType<typeof createShieldBridge> | null = null;
let manager: TabManager | null = null;
let mainWindow: BrowserWindow | null = null;

function emitWindowState(): void {
  if (mainWindow === null || mainWindow.isDestroyed()) return;
  const payload = WindowStateSchema.parse({
    maximized: mainWindow.isMaximized(),
  });
  mainWindow.webContents.send(IPC_EVENTS.shell.windowStateChanged, payload);
}

function currentShieldStats(origin?: { readonly webContentsId: number | null }): unknown {
  const bridge = bridgeRef;
  if (bridge === null || manager === null) {
    return {
      tabId: null,
      blockedCount: 0,
      engineState: "uninitialised",
      lastError: null,
      enabled: true,
    };
  }
  const tabId =
    origin?.webContentsId == null
      ? null
      : manager.ownerOf(origin.webContentsId);
  return ShieldStatsSchema.parse({
    tabId,
    blockedCount: bridge.counts.total,
    engineState: bridge.engine.state,
    lastError: bridge.engine.lastError,
    enabled: bridge.engine.enabled,
  });
}

function broadcast(channel: string, payload: unknown): void {
  const targets: Electron.WebContents[] = [];
  if (mainWindow !== null && !mainWindow.isDestroyed()) {
    targets.push(mainWindow.webContents);
  }
  if (manager !== null) {
    for (const tab of manager.snapshot().tabs) {
      if (!tab.url.startsWith("mine://newtab")) continue;
      const handle = manager.ownerHandle(tab.id);
      if (
        handle !== undefined &&
        !handle.isDestroyed() &&
        !targets.includes(handle)
      ) {
        targets.push(handle);
      }
    }
  }
  for (const target of targets) {
    try {
      target.send(channel, payload);
    } catch {
      // a crashed view cannot receive pushes; the next event retries
    }
  }
}

function bootstrap(): void {
  const bridge = createShieldBridge();
  bridgeRef = bridge;
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

  const sendTabs = (): void => {
    if (manager === null) return;
    broadcast(IPC_EVENTS.shell.tabsUpdated, manager.snapshot());
  };
  manager = new TabManager(win, sendTabs, history, {
    stripParams: stripTrackingParams,
    internalPreloadPath: fileURLToPath(
      new URL("./preload.cjs", import.meta.url),
    ),
  });
  const downloadEngine = new DownloadEngine();
  downloadEngine.on((downloads) => {
    broadcast(IPC_EVENTS.fetcher.downloadsUpdated, downloads);
  });

  defaultSession().on("will-download", (_event, item) => {
    const url = item.getURL();
    const filename = item.getFilename();
    item.cancel();
    void downloadEngine.startDownload(url, { filename });
  });

  const setShieldEnabled = (enabled: boolean): void => {
    if (bridge === null) return;
    bridge.engine.setEnabled(enabled);
    broadcast(
      IPC_EVENTS.shield.statsUpdated,
      currentShieldStats({ webContentsId: null }),
    );
  };
  registerIpcHandlers(manager, win, {
    currentShieldStats,
    setShieldEnabled,
    currentDownloads: () => downloadEngine.getDownloads(),
    onDownloadAction: (action: string, param1: string, param2?: unknown) => {
      if (action === "pause") downloadEngine.pause(param1);
      else if (action === "resume") void downloadEngine.resume(param1);
      else if (action === "cancel") downloadEngine.cancel(param1);
      else if (action === "retry") void downloadEngine.retry(param1);
      else if (action === "add") void downloadEngine.startDownload(param1, { saveDir: typeof param2 === "string" ? param2 : undefined });
      else if (action === "remove") void downloadEngine.removeDownload(param1, false);
      else if (action === "deleteFile") void downloadEngine.removeDownload(param1, Boolean(param2));
      else if (action === "openFile") {
        const item = downloadEngine.getDownload(param1);
        if (item?.savePath) void shell.openPath(item.savePath);
      } else if (action === "showInFolder") {
        const item = downloadEngine.getDownload(param1);
        if (item?.savePath) shell.showItemInFolder(item.savePath);
      }
    },
  });

  win.on("maximize", emitWindowState);
  win.on("unmaximize", emitWindowState);
  win.on("restore", emitWindowState);
  win.webContents.on("did-finish-load", () => {
    emitWindowState();
    sendTabs();
  });

  const sampler = new TelemetrySampler(
    (snapshot) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_EVENTS.shell.telemetryUpdated, snapshot);
      }
    },
    () => bridge.requestRate.inLastMinute(),
  );
  sampler.start();
  app.on("before-quit", () => {
    sampler.stop();
    downloadEngine.dispose();
  });

  bridge.setEmitter((signal) => {
    if (win.isDestroyed()) return;
    broadcast(IPC_EVENTS.shield.statsUpdated, currentShieldStats(signal));
  });
  void bridge.start();

  win.on("resize", () => manager?.layout());
  win.on("maximize", () => manager?.layout());
  win.on("unmaximize", () => manager?.layout());

  void win.loadURL("mine://chrome/");
  void manager.createTab();

  const screenshotDir = process.env.MINE_SCREENSHOT_DIR;
  if (screenshotDir !== undefined && screenshotDir.length > 0) {
    void visualSmoke(win, screenshotDir);
  }
}

async function visualSmoke(
  win: BrowserWindow,
  dir: string,
): Promise<void> {
  await mkdir(dir, { recursive: true });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const diag = {
    engineState: bridgeRef?.engine.state ?? "unknown",
    nativeAttached: bridgeRef?.engine.hasNative ?? false,
    lastError: bridgeRef?.engine.lastError ?? null,
    blockedTotal: bridgeRef?.counts.total ?? -1,
    tabs: manager?.snapshot().tabs ?? [],
  };
  await writeFile(
    path.join(dir, "diag.json"),
    JSON.stringify(diag, null, 2),
  );
  if (win.isDestroyed()) return;
  win.show();
  const capture = async (wc: Electron.WebContents): Promise<Buffer | null> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const image = await wc.capturePage();
      const png = image.toPNG();
      if (png.length > 1000) return png;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return null;
  };
  const chrome = await capture(win.webContents);
  if (chrome !== null) {
    await writeFile(path.join(dir, "chrome.png"), chrome);
  }
  const tabs = manager?.snapshot().tabs ?? [];
  for (const tab of tabs) {
    const handle = manager?.ownerHandle(tab.id);
    if (handle === undefined) continue;
    const png = await capture(handle);
    if (png !== null) {
      await writeFile(path.join(dir, `view-${tab.id}.png`), png);
    }
  }
  app.exit(0);
}

app.whenReady().then(() => {
  bootstrap();
});

app.on("window-all-closed", () => {
  app.quit();
});
