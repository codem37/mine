import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS, IPC_EVENTS } from "@mine/contracts/channels";
import type {
  NavigateRequest,
  NewTabRequest,
  Result,
  SetShieldEnabledRequest,
  ShieldStats,
  TabIdRequest,
  TabsUpdatedPayload,
  Telemetry,
  WindowState,
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
  getTabs: (): Promise<Result<TabsUpdatedPayload>> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.getTabs, {}),
  getShieldStats: (): Promise<Result<ShieldStats>> =>
    ipcRenderer.invoke(IPC_CHANNELS.shield.getStats, {}),
  setShieldEnabled: (
    payload: SetShieldEnabledRequest,
  ): Promise<Result<ShieldStats>> =>
    ipcRenderer.invoke(IPC_CHANNELS.shield.setEnabled, payload),
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
  minimizeWindow: (): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.minimizeWindow, {}),
  toggleMaximizeWindow: (): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.toggleMaximizeWindow, {}),
  closeWindow: (): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.shell.closeWindow, {}),
  onWindowState: (callback: (payload: WindowState) => void): (() => void) => {
    const listener = (_event: unknown, payload: WindowState): void => {
      callback(payload);
    };
    ipcRenderer.on(IPC_EVENTS.shell.windowStateChanged, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.shell.windowStateChanged, listener);
    };
  },
  onTelemetry: (callback: (payload: Telemetry) => void): (() => void) => {
    const listener = (_event: unknown, payload: Telemetry): void => {
      callback(payload);
    };
    ipcRenderer.on(IPC_EVENTS.shell.telemetryUpdated, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.shell.telemetryUpdated, listener);
    };
  },
  getDownloads: (): Promise<Result<import("@mine/contracts").DownloadsUpdatedPayload>> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.getDownloads, {}),
  pauseDownload: (payload: import("@mine/contracts").DownloadIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.pauseDownload, payload),
  resumeDownload: (payload: import("@mine/contracts").DownloadIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.resumeDownload, payload),
  cancelDownload: (payload: import("@mine/contracts").DownloadIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.cancelDownload, payload),
  retryDownload: (payload: import("@mine/contracts").DownloadIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.retryDownload, payload),
  openDownloadFile: (payload: import("@mine/contracts").DownloadIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.openFile, payload),
  showDownloadInFolder: (payload: import("@mine/contracts").DownloadIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.showInFolder, payload),
  addDownload: (payload: import("@mine/contracts").AddDownloadRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.addDownload, payload),
  removeDownload: (payload: import("@mine/contracts").DownloadIdRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.removeDownload, payload),
  deleteFile: (payload: import("@mine/contracts").DeleteFileRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.deleteFile, payload),
  getStorageInfo: (): Promise<Result<import("@mine/contracts").StorageInfo>> =>
    ipcRenderer.invoke(IPC_CHANNELS.fetcher.getStorageInfo, {}),
  onDownloadsUpdated: (callback: (payload: import("@mine/contracts").DownloadsUpdatedPayload) => void): (() => void) => {
    const listener = (_event: unknown, payload: import("@mine/contracts").DownloadsUpdatedPayload): void => {
      callback(payload);
    };
    ipcRenderer.on(IPC_EVENTS.fetcher.downloadsUpdated, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.fetcher.downloadsUpdated, listener);
    };
  },
  getDetectedStreams: (): Promise<Result<readonly import("@mine/contracts").MediaSource[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.media.getDetectedStreams, {}),
  playNativeMedia: (payload: import("@mine/contracts").PlayNativeRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.media.playNative, payload),
  getMediaState: (): Promise<Result<import("@mine/contracts").PlayerState>> =>
    ipcRenderer.invoke(IPC_CHANNELS.media.getState, {}),
  controlMedia: (payload: import("@mine/contracts").MediaControlRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.media.control, payload),
  downloadMediaSource: (payload: import("@mine/contracts").MediaItemDownloadRequest): Promise<InvokeResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.media.downloadSource, payload),
  onStreamDetected: (callback: (payload: readonly import("@mine/contracts").MediaSource[]) => void): (() => void) => {
    const listener = (_event: unknown, payload: readonly import("@mine/contracts").MediaSource[]): void => {
      callback(payload);
    };
    ipcRenderer.on(IPC_EVENTS.media.streamDetected, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.media.streamDetected, listener);
    };
  },
  onPlayerStateChanged: (callback: (payload: import("@mine/contracts").PlayerState) => void): (() => void) => {
    const listener = (_event: unknown, payload: import("@mine/contracts").PlayerState): void => {
      callback(payload);
    };
    ipcRenderer.on(IPC_EVENTS.media.playerStateChanged, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.media.playerStateChanged, listener);
    };
  },
  search: (payload: import("@mine/contracts").SearchRequest): Promise<Result<import("@mine/contracts").SearchResponse>> =>
    ipcRenderer.invoke(IPC_CHANNELS.search.query, payload),
};

export type MineBridge = typeof api;

contextBridge.exposeInMainWorld("mine", api);
