import { z } from "zod";
import { LOAD_STATES } from "../types/navigation.js";
import type { NavigationState } from "../types/navigation.js";
import type { TabSnapshot } from "../types/tab.js";
import { SHIELD_ENGINE_STATES } from "../shield/verdict.js";

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

export const DOWNLOAD_STATES = [
  "queued",
  "downloading",
  "paused",
  "resuming",
  "completed",
  "failed",
  "cancelled",
] as const;

export const DownloadStateSchema = z.enum(DOWNLOAD_STATES);
export type DownloadState = z.infer<typeof DownloadStateSchema>;

export const DownloadSegmentSchema = z.object({
  id: z.number().int().min(0),
  progressPercent: z.number().min(0).max(100),
  active: z.boolean(),
});

export type DownloadSegment = z.infer<typeof DownloadSegmentSchema>;

export const DownloadItemSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  url: UrlSchema,
  state: DownloadStateSchema,
  downloadedBytes: z.number().min(0),
  totalBytes: z.number().min(0),
  speedBytesPerSec: z.number().min(0),
  etaSeconds: z.number().min(0).nullable(),
  segments: z.array(DownloadSegmentSchema),
});

export type DownloadItem = z.infer<typeof DownloadItemSchema>;

export const DownloadIdRequestSchema = z.object({
  downloadId: z.string().min(1),
});

export type DownloadIdRequest = z.infer<typeof DownloadIdRequestSchema>;

export const DownloadsUpdatedPayloadSchema = z.array(DownloadItemSchema);
export type DownloadsUpdatedPayload = z.infer<typeof DownloadsUpdatedPayloadSchema>;

