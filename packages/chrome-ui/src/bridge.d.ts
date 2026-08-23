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
}

declare global {
  interface Window {
    mine: MineBridge;
  }
}

export {};
