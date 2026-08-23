import type {
  DownloadIdRequest,
  DownloadItem,
  DownloadsUpdatedPayload,
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

export interface MineBridge {
  navigate(payload: NavigateRequest): Promise<InvokeResult>;
  newTab(payload?: NewTabRequest): Promise<InvokeResult>;
  closeTab(payload: TabIdRequest): Promise<InvokeResult>;
  activateTab(payload: TabIdRequest): Promise<InvokeResult>;
  goBack(payload: TabIdRequest): Promise<InvokeResult>;
  goForward(payload: TabIdRequest): Promise<InvokeResult>;
  reload(payload: TabIdRequest): Promise<InvokeResult>;
  stop(payload: TabIdRequest): Promise<InvokeResult>;
  getTabs(): Promise<Result<TabsUpdatedPayload>>;
  getShieldStats(): Promise<Result<ShieldStats>>;
  setShieldEnabled(payload: SetShieldEnabledRequest): Promise<Result<ShieldStats>>;
  minimizeWindow(): Promise<InvokeResult>;
  toggleMaximizeWindow(): Promise<InvokeResult>;
  closeWindow(): Promise<InvokeResult>;
  onTabsUpdated(cb: (payload: TabsUpdatedPayload) => void): () => void;
  onShieldStats(cb: (payload: ShieldStats) => void): () => void;
  onWindowState(cb: (payload: WindowState) => void): () => void;
  onTelemetry(cb: (payload: Telemetry) => void): () => void;
  getDownloads(): Promise<Result<DownloadsUpdatedPayload>>;
  pauseDownload(payload: DownloadIdRequest): Promise<InvokeResult>;
  resumeDownload(payload: DownloadIdRequest): Promise<InvokeResult>;
  cancelDownload(payload: DownloadIdRequest): Promise<InvokeResult>;
  retryDownload(payload: DownloadIdRequest): Promise<InvokeResult>;
  openDownloadFile(payload: DownloadIdRequest): Promise<InvokeResult>;
  showDownloadInFolder(payload: DownloadIdRequest): Promise<InvokeResult>;
  addDownload(payload: import("@mine/contracts").AddDownloadRequest): Promise<InvokeResult>;
  removeDownload(payload: DownloadIdRequest): Promise<InvokeResult>;
  deleteFile(payload: import("@mine/contracts").DeleteFileRequest): Promise<InvokeResult>;
  getStorageInfo(): Promise<Result<import("@mine/contracts").StorageInfo>>;
  onDownloadsUpdated(cb: (payload: DownloadsUpdatedPayload) => void): () => void;
  getDetectedStreams(): Promise<Result<readonly import("@mine/contracts").MediaStream[]>>;
  playNativeMedia(payload: import("@mine/contracts").PlayNativeRequest): Promise<InvokeResult>;
  onStreamDetected(cb: (payload: readonly import("@mine/contracts").MediaStream[]) => void): () => void;
}

declare global {
  interface Window {
    mine: MineBridge;
  }
}

export {};
