import type { SecurityVerdict } from "./safety.js";

export type ProtocolType = "ipfs" | "ens" | "https";

export interface ENSResolution {
  readonly name: string;
  readonly address?: string;
  readonly contentTarget?: string;
  readonly avatar?: string;
  readonly records?: Record<string, string>;
  readonly status: "resolving" | "resolved" | "unresolved" | "invalid" | "timeout";
}

export interface IPFSResource {
  readonly cid: string;
  readonly status: "resolving" | "fetching" | "cached" | "pinned" | "unavailable" | "invalid";
  readonly cached: boolean;
  readonly pinned: boolean;
  readonly sizeBytes?: number;
  readonly gatewayUsed?: string;
}

export interface IPFSStorageStats {
  readonly pinnedCount: number;
  readonly cacheSizeBytes: number;
  readonly pinnedSizeBytes: number;
  readonly availableBytes: number;
}

export interface ProtocolInfoPayload {
  readonly protocol: ProtocolType;
  readonly ens?: ENSResolution;
  readonly ipfs?: IPFSResource;
  readonly storage?: IPFSStorageStats;
  readonly safetyVerdict?: SecurityVerdict;
}

export interface PinRequest {
  readonly cid: string;
}
