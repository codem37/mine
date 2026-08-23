export const DOWNLOAD_STATES = [
  "queued",
  "downloading",
  "paused",
  "resuming",
  "completed",
  "failed",
  "cancelled",
] as const;

export type DownloadState = (typeof DOWNLOAD_STATES)[number];

export interface DownloadSegment {
  readonly id: number;
  readonly startByte?: number;
  readonly endByte?: number;
  readonly downloadedBytes?: number;
  readonly progressPercent: number;
  readonly active: boolean;
}

export interface DownloadItem {
  readonly id: string;
  readonly filename: string;
  readonly url: string;
  readonly savePath?: string;
  readonly state: DownloadState;
  readonly downloadedBytes: number;
  readonly totalBytes: number;
  readonly speedBytesPerSec: number;
  readonly etaSeconds: number | null;
  readonly segments: readonly DownloadSegment[];
  readonly isTorrent?: boolean;
  readonly peersCount?: number;
  readonly errorMessage?: string | null;
}
