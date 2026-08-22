import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS, IPC_EVENTS } from "@mine/contracts/channels";
import type {
  NavigateRequest,
  NewTabRequest,
  Result,
  ShieldStats,
  TabIdRequest,
  TabsUpdatedPayload,
} from "@mine/contracts";

type InvokeResult = Result<unknown>;

const api = {
  navigate: (payload: NavigateRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.navigate, payload),
  newTab: (payload: NewTabRequest = {}): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.newTab, payload),
  closeTab: (payload: TabIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.closeTab, payload),
  activateTab: (payload: TabIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.activateTab, payload),
  goBack: (payload: TabIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.goBack, payload),
  goForward: (payload: TabIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.goForward, payload),
  reload: (payload: TabIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.reload, payload),
  stop: (payload: TabIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.stop, payload),
  onTabsUpdated: (
    callback: (payload: TabsUpdatedPayload) => void,
  ): (() => void) => {
    const listener = (_event: unknown, payload: TabsUpdatedPayload): void => {
      callback(payload);
    };
    ipcRenderer.on(IPC_EVENTS.shell.tabsUpdated, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.shell.tabsUpdated, listener);
    };
  },
  onShieldStats: (callback: (payload: ShieldStats) => void): (() => void) => {
    const listener = (_event: unknown, payload: ShieldStats): void => {
      callback(payload);
    };
    ipcRenderer.on(IPC_EVENTS.shield.statsUpdated, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.shield.statsUpdated, listener);
    };
  },
};

export type MineBridge = typeof api;

contextBridge.exposeInMainWorld("mine", api);
