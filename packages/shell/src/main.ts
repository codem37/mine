import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import { IPC_EVENTS } from "@mine/contracts";
import { TabManager } from "./tab-manager.js";
import type { HistoryEntry } from "./tab-manager.js";
import {
  attachChromeProtocol,
  chromeAssetRoot,
  declarePrivilegedScheme,
} from "./protocol.js";
import { defaultSession } from "./sessions.js";
import { registerIpcHandlers } from "./ipc.js";

declarePrivilegedScheme();

const history: HistoryEntry[] = [];
let manager: TabManager | null = null;

function bootstrap(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: fileURLToPath(new URL("./preload.cjs", import.meta.url)),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  manager = new TabManager(win, () => {
    if (!win.isDestroyed() && manager !== null) {
      win.webContents.send(IPC_EVENTS.shell.tabsUpdated, manager.snapshot());
    }
  }, history);
  registerIpcHandlers(manager);

  win.on("resize", () => manager?.layout());
  win.on("maximize", () => manager?.layout());
  win.on("unmaximize", () => manager?.layout());

  void win.loadURL("mine://chrome/");
  void manager.createTab();
}

app.whenReady().then(() => {
  attachChromeProtocol(defaultSession(), chromeAssetRoot());
  defaultSession().setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
  bootstrap();
});

app.on("window-all-closed", () => {
  app.quit();
});
