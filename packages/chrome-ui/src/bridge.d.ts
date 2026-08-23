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
  getDetectedStreams(): Promise<Result<readonly import("@mine/contracts").MediaSource[]>>;
  playNativeMedia(payload: import("@mine/contracts").PlayNativeRequest): Promise<InvokeResult>;
  getMediaState(): Promise<Result<import("@mine/contracts").PlayerState>>;
  controlMedia(payload: import("@mine/contracts").MediaControlRequest): Promise<InvokeResult>;
  downloadMediaSource(payload: import("@mine/contracts").MediaItemDownloadRequest): Promise<InvokeResult>;
  onStreamDetected(cb: (payload: readonly import("@mine/contracts").MediaSource[]) => void): () => void;
  onPlayerStateChanged(cb: (payload: import("@mine/contracts").PlayerState) => void): () => void;
  search(payload: import("@mine/contracts").SearchRequest): Promise<Result<import("@mine/contracts").SearchResponse>>;
  getSuggestions(payload: import("@mine/contracts").SuggestRequest): Promise<Result<import("@mine/contracts").SuggestResponse>>;
  getSecurityVerdict(payload: import("@mine/contracts").NavigateRequest): Promise<Result<import("@mine/contracts").SecurityVerdict>>;
  getProtectionStats(): Promise<Result<import("@mine/contracts").ProtectionCenterStats>>;
  addSafetyException(payload: import("@mine/contracts").AddExceptionRequest): Promise<InvokeResult>;
  getSecurityEvents(): Promise<Result<readonly import("@mine/contracts").SecurityEvent[]>>;
  resolveProtocolUrl(payload: import("@mine/contracts").NavigateRequest): Promise<Result<unknown>>;
  getProtocolInfo(payload: import("@mine/contracts").NavigateRequest): Promise<Result<import("@mine/contracts").ProtocolInfoPayload>>;
  pinIpfsCid(payload: import("@mine/contracts").PinRequest): Promise<InvokeResult>;
  unpinIpfsCid(payload: import("@mine/contracts").PinRequest): Promise<InvokeResult>;
  clearIpfsCache(): Promise<InvokeResult>;
  getIpfsStorageStats(): Promise<Result<import("@mine/contracts").IPFSStorageStats>>;
  saveSessionState(state: Partial<import("@mine/contracts").SessionState>): Promise<Result<import("@mine/contracts").SessionState>>;
  getSessionState(): Promise<Result<import("@mine/contracts").SessionState>>;
  getSubsystemHealth(): Promise<Result<readonly import("@mine/contracts").SubsystemHealth[]>>;
  restartSubsystemComponent(componentId: string): Promise<Result<import("@mine/contracts").SubsystemHealth>>;
}

declare global {
  interface Window {
    mine: MineBridge;
  }
}

export {};
