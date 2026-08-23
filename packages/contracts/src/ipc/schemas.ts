import { z } from "zod";
import { LOAD_STATES } from "../types/navigation.js";
import type { NavigationState } from "../types/navigation.js";
import type { TabSnapshot } from "../types/tab.js";
import { SHIELD_ENGINE_STATES } from "../shield/verdict.js";
import { DOWNLOAD_STATES } from "../types/download.js";
import type {
  DownloadItem,
  DownloadSegment,
  DownloadState,
} from "../types/download.js";

export const TabIdSchema = z.string().min(1);

export const UrlSchema = z.url();

export const LoadStateSchema = z.enum(LOAD_STATES);

export const NavigateRequestSchema = z.object({
  tabId: TabIdSchema,
  url: UrlSchema,
});

export type NavigateRequest = z.infer<typeof NavigateRequestSchema>;

export const TabIdRequestSchema = z.object({
  tabId: TabIdSchema,
});

export type TabIdRequest = z.infer<typeof TabIdRequestSchema>;

export const NewTabRequestSchema = z.object({
  url: UrlSchema.optional(),
});

export type NewTabRequest = z.infer<typeof NewTabRequestSchema>;

export const TabSnapshotSchema: z.ZodType<TabSnapshot> = z.object({
  id: TabIdSchema,
  url: UrlSchema,
  title: z.string(),
  favicons: z.array(z.string()).optional(),
  loadState: LoadStateSchema,
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
});

export const TabListSchema = z.array(TabSnapshotSchema);

export const TabsUpdatedPayloadSchema = z.object({
  tabs: TabListSchema,
  activeTabId: TabIdSchema.nullable(),
});

export type TabsUpdatedPayload = z.infer<typeof TabsUpdatedPayloadSchema>;

export const NavigationStateSchema: z.ZodType<NavigationState> = z.object({
  url: UrlSchema,
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  loadState: LoadStateSchema,
  errorCode: z.number().int().optional(),
});

export const ShieldStatsSchema = z.object({
  tabId: TabIdSchema.nullable(),
  blockedCount: z.number().int().min(0),
  engineState: z.enum(SHIELD_ENGINE_STATES),
  lastError: z.string().nullable(),
  enabled: z.boolean(),
});

export type ShieldStats = z.infer<typeof ShieldStatsSchema>;

export const SetShieldEnabledRequestSchema = z.object({
  enabled: z.boolean(),
});

export type SetShieldEnabledRequest = z.infer<
  typeof SetShieldEnabledRequestSchema
>;

export const UnitRequestSchema = z.object({}).strict();

export const WindowStateSchema = z.object({
  maximized: z.boolean(),
});

export type WindowState = z.infer<typeof WindowStateSchema>;

export const TelemetrySchema = z.object({
  cpuPercent: z.number().min(0).max(100).nullable(),
  ramMb: z.number().min(0).nullable(),
  gpuPercent: z.null(),
  netRequestsPerMinute: z.number().int().min(0),
});

export type Telemetry = z.infer<typeof TelemetrySchema>;

export { DOWNLOAD_STATES } from "../types/download.js";
export type { DownloadState, DownloadSegment, DownloadItem } from "../types/download.js";

export const DownloadStateSchema = z.enum(DOWNLOAD_STATES);

export const DownloadSegmentSchema: z.ZodType<DownloadSegment> = z.object({
  id: z.number().int().min(0),
  startByte: z.number().int().min(0).optional(),
  endByte: z.number().int().min(0).optional(),
  downloadedBytes: z.number().int().min(0).optional(),
  progressPercent: z.number().min(0).max(100),
  active: z.boolean(),
});

export const DownloadItemSchema: z.ZodType<DownloadItem> = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  url: z.string().min(1),
  savePath: z.string().optional(),
  state: DownloadStateSchema,
  downloadedBytes: z.number().min(0),
  totalBytes: z.number().min(0),
  speedBytesPerSec: z.number().min(0),
  etaSeconds: z.number().min(0).nullable(),
  segments: z.array(DownloadSegmentSchema),
  isTorrent: z.boolean().optional(),
  peersCount: z.number().int().min(0).optional(),
  errorMessage: z.string().nullable().optional(),
});

export const DownloadIdRequestSchema = z.object({
  downloadId: z.string().min(1),
});

export type DownloadIdRequest = z.infer<typeof DownloadIdRequestSchema>;

export const AddDownloadRequestSchema = z.object({
  url: z.string().min(1),
  savePath: z.string().optional(),
});

export type AddDownloadRequest = z.infer<typeof AddDownloadRequestSchema>;

export const DeleteFileRequestSchema = z.object({
  downloadId: z.string().min(1),
  deleteFromDisk: z.boolean().default(false),
});

export type DeleteFileRequest = z.infer<typeof DeleteFileRequestSchema>;

export const StorageInfoSchema = z.object({
  usedBytes: z.number().min(0),
  freeBytes: z.number().min(0),
});

export type StorageInfo = z.infer<typeof StorageInfoSchema>;

export const DownloadsUpdatedPayloadSchema = z.array(DownloadItemSchema);
export type DownloadsUpdatedPayload = readonly DownloadItem[];


