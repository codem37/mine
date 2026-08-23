import type { TabGroup, Workspace } from "./workspace.js";

export type HealthStatus = "ready" | "running" | "degraded" | "unavailable" | "error";

export interface SubsystemHealth {
  readonly id: string;
  readonly name: string;
  readonly status: HealthStatus;
  readonly details?: string;
  readonly lastChecked: number;
}

export interface SessionState {
  readonly workspaces: readonly Workspace[];
  readonly activeWorkspaceId: string;
  readonly tabGroups: readonly TabGroup[];
  readonly windowBounds?: {
    readonly width: number;
    readonly height: number;
    readonly x: number;
    readonly y: number;
  };
  readonly crashed?: boolean;
}

export interface BackupData {
  readonly version: string;
  readonly timestamp: number;
  readonly workspaces: readonly Workspace[];
  readonly settings: Record<string, unknown>;
  readonly shortcuts: Record<string, string>;
}
