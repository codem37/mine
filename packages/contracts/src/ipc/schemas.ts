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

export const SetOverlayActiveRequestSchema = z.object({
  active: z.boolean(),
});
export type SetOverlayActiveRequest = z.infer<typeof SetOverlayActiveRequestSchema>;

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
  adsBlocked: z.number().int().min(0).default(0),
  trackersBlocked: z.number().int().min(0).default(0),
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

export const SiteShieldSettingsSchema = z.object({
  domain: z.string().min(1),
  adsBlocked: z.boolean(),
  trackersBlocked: z.boolean(),
  cosmeticsEnabled: z.boolean(),
  allowlisted: z.boolean(),
});

export type SiteShieldSettings = z.infer<typeof SiteShieldSettingsSchema>;

export const SetSiteShieldSettingsRequestSchema = z.object({
  domain: z.string().min(1),
  adsBlocked: z.boolean().optional(),
  trackersBlocked: z.boolean().optional(),
  cosmeticsEnabled: z.boolean().optional(),
  allowlisted: z.boolean().optional(),
});

export type SetSiteShieldSettingsRequest = z.infer<typeof SetSiteShieldSettingsRequestSchema>;

export const GetSiteShieldSettingsRequestSchema = z.object({
  domain: z.string().min(1),
});

export const FilterListInfoSchema = z.object({
  name: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  optional: z.boolean(),
  lastUpdated: z.number().nullable(),
  ruleCount: z.number().int().min(0),
});

export type FilterListInfo = z.infer<typeof FilterListInfoSchema>;

export const AddCustomListRequestSchema = z.object({
  url: z.string().url().refine((u) => u.startsWith("https://"), {
    message: "Custom filter list URLs must use HTTPS",
  }),
});

export type AddCustomListRequest = z.infer<typeof AddCustomListRequestSchema>;

export const RemoveCustomListRequestSchema = z.object({
  name: z.string().min(1),
});

export const ShieldDiagnosticsSchema = z.object({
  engineState: z.enum(SHIELD_ENGINE_STATES),
  networkRules: z.number().int().min(0),
  cosmeticRules: z.number().int().min(0),
  listCount: z.number().int().min(0),
  lastUpdate: z.number().nullable(),
  adsBlockedTotal: z.number().int().min(0),
  trackersBlockedTotal: z.number().int().min(0),
});

export type ShieldDiagnostics = z.infer<typeof ShieldDiagnosticsSchema>;



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

import { MEDIA_FORMATS } from "../types/media.js";
import type {
  MediaFormat,
  MediaSource as MineMediaSource,
  PlayerState as MinePlayerState,
  PlayNativeRequest,
  MediaControlRequest,
  LoadSubtitleRequest,
  MediaItemDownloadRequest,
} from "../types/media.js";
export { MEDIA_FORMATS } from "../types/media.js";
export type {
  MediaFormat,
  MediaSource,
  PlayerState,
  PlayNativeRequest,
  MediaControlRequest,
  LoadSubtitleRequest,
  MediaItemDownloadRequest,
} from "../types/media.js";

export const MediaFormatSchema = z.enum(MEDIA_FORMATS);

export const MediaQualitySchema = z.object({
  label: z.string().min(1),
  bitrateBps: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const MediaTrackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  language: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const MediaSourceSchema: z.ZodType<MineMediaSource> = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  mimeType: z.string().min(1),
  format: MediaFormatSchema,
  title: z.string().optional(),
  isDrmProtected: z.boolean(),
  isLive: z.boolean(),
  durationSeconds: z.number().min(0).nullable().optional(),
  qualities: z.array(MediaQualitySchema),
  audioTracks: z.array(MediaTrackSchema),
  subtitleTracks: z.array(MediaTrackSchema),
  playbackPosition: z.number().optional(),
  thumbnailUrl: z.string().optional(),
});

export const PlaybackDiagnosticsSchema = z.object({
  decoder: z.string(),
  renderer: z.string(),
  droppedFrames: z.number(),
  renderedFrames: z.number(),
  hwDecoding: z.boolean(),
  audioVideoSyncMs: z.number(),
});

export const VideoTransformSchema = z.object({
  fit: z.enum(["contain", "cover", "fill", "original"]),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  flipH: z.boolean(),
  flipV: z.boolean(),
});

export const EqualizerStateSchema = z.object({
  enabled: z.boolean(),
  preset: z.string(),
  bands: z.array(z.number()),
});

export const PlayerStateSchema: z.ZodType<MinePlayerState> = z.object({
  sourceId: z.string().nullable(),
  status: z.enum(["idle", "buffering", "playing", "paused", "ended", "error"]),
  currentTime: z.number(),
  duration: z.number(),
  bufferedSeconds: z.number(),
  volume: z.number(),
  volumeBoost: z.number(),
  muted: z.boolean(),
  playbackRate: z.number(),
  activeQuality: z.string(),
  activeAudioTrack: z.string().nullable(),
  activeSubtitleTrack: z.string().nullable(),
  subtitleOffsetSeconds: z.number(),
  audioOffsetSeconds: z.number(),
  loopState: z.enum(["off", "single", "range"]),
  loopRange: z.tuple([z.number(), z.number()]).nullable(),
  currentFrame: z.number(),
  frameFps: z.number(),
  fullscreen: z.boolean(),
  videoTransform: VideoTransformSchema,
  equalizer: EqualizerStateSchema,
  activeTabMediaCount: z.number(),
  diagnostics: PlaybackDiagnosticsSchema,
});

export const PlayNativeRequestSchema: z.ZodType<PlayNativeRequest> = z.object({
  streamId: z.string().min(1),
  url: z.string().min(1),
  title: z.string().optional(),
});

export const MediaControlRequestSchema: z.ZodType<MediaControlRequest> = z.object({
  action: z.enum(["play", "pause", "seek", "setVolume", "setMute", "setSpeed", "setQuality", "setSubtitle", "setAudioTrack", "setABLoop", "stepFrame", "setSubtitleOffset", "setAudioOffset"]),
  value: z.any().optional(),
});

export const LoadSubtitleRequestSchema: z.ZodType<LoadSubtitleRequest> = z.object({
  filePath: z.string().min(1),
  label: z.string().optional(),
});

export const MediaItemDownloadRequestSchema: z.ZodType<MediaItemDownloadRequest> = z.object({
  sourceId: z.string().min(1),
  url: z.string().min(1),
  title: z.string().min(1),
  quality: z.string().optional(),
  format: MediaFormatSchema.optional(),
});

export type { SearchRequest, SearchResponse, SearchResult, SearchFacet } from "../types/search.js";

export const SearchModeSchema = z.enum(["all", "images", "videos", "news", "shopping", "academic"]);

export const SearchResultTypeSchema = z.enum(["web", "image", "video", "news", "product", "academic"]);

export const ProductSpecsSchema = z.object({
  brand: z.string().optional(),
  cpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  gpu: z.string().optional(),
  display: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
});

export const SearchResultSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  title: z.string().min(1),
  snippet: z.string(),
  engine: z.string(),
  score: z.number(),
  type: SearchResultTypeSchema,
  domain: z.string(),
  category: z.string().optional(),
  publishedDate: z.string().optional(),
  favicon: z.string().optional(),
  thumbnail: z.string().optional(),
  sourceCount: z.number().optional(),
  badges: z.array(z.string()).optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  seller: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  availability: z.string().optional(),
  specs: ProductSpecsSchema.optional(),
  authors: z.array(z.string()).optional(),
  year: z.number().optional(),
  journal: z.string().optional(),
  doi: z.string().optional(),
  citationCount: z.number().optional(),
  pdfUrl: z.string().optional(),
  durationSeconds: z.number().optional(),
  resolution: z.string().optional(),
  mediaStreamUrl: z.string().optional(),
});

export const FacetValueSchema = z.object({
  label: z.string(),
  count: z.number(),
  value: z.string(),
});

export const DynamicFacetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["checkbox", "range", "select"]),
  values: z.array(FacetValueSchema),
  range: z.tuple([z.number(), z.number()]).optional(),
});

export const SearchRequestSchema = z.object({
  query: z.string().min(1),
  mode: SearchModeSchema.optional(),
  category: z.string().optional(),
  page: z.number().min(1).optional(),
  appliedFacets: z.record(z.string(), z.any()).optional(),
  region: z.string().optional(),
  language: z.string().optional(),
  safeSearch: z.enum(["on", "moderate", "off"]).optional(),
  isPrivate: z.boolean().optional(),
});

export const SearchDiagnosticsSchema = z.object({
  sourcesQueried: z.number(),
  sourcesAvailable: z.number(),
  queryVariants: z.number(),
  resultsMerged: z.number(),
  resultsReranked: z.number(),
  cacheStatus: z.enum(["HIT", "MISS"]),
  latencyMs: z.number(),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  interpretedQuery: z.string().optional(),
  typoCorrection: z.string().optional(),
  mode: SearchModeSchema,
  results: z.array(SearchResultSchema),
  facets: z.array(DynamicFacetSchema),
  relatedQueries: z.array(z.string()),
  totalResults: z.number(),
  timeMs: z.number(),
  cacheStatus: z.enum(["HIT", "MISS"]),
  diagnostics: SearchDiagnosticsSchema,
});

export const SuggestRequestSchema = z.object({
  query: z.string().min(1),
  isPrivate: z.boolean().optional(),
});

export const SuggestionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  url: z.string().optional(),
  category: z.enum(["history", "bookmark", "completion", "contextual"]),
  title: z.string().optional(),
});

export const SuggestResponseSchema = z.object({
  query: z.string(),
  suggestions: z.array(SuggestionItemSchema),
});

export const ThreatCategorySchema = z.enum([
  "phishing",
  "malware",
  "scam",
  "lookalike",
  "deceptive",
  "dangerous-download",
  "malicious-redirect",
  "suspicious-resource",
  "certificate",
  "connection",
  "unknown",
]);

export const SafetyStateSchema = z.enum([
  "safe",
  "informational",
  "suspicious",
  "dangerous",
  "blocked",
  "unknown",
  "database-stale",
  "database-unavailable",
]);

export const SafetyActionSchema = z.enum(["allow", "warn", "block", "quarantine"]);

export const SecurityVerdictSchema = z.object({
  state: SafetyStateSchema,
  category: ThreatCategorySchema,
  severity: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  source: z.string(),
  reason: z.string().optional(),
  url: z.string(),
  timestamp: z.number(),
  action: SafetyActionSchema,
  expires: z.number().optional(),
  intendedUrl: z.string().optional(),
});

export const AddExceptionRequestSchema = z.object({
  domain: z.string().min(1),
  durationMinutes: z.number().optional(),
});

export const ProtocolTypeSchema = z.enum(["ipfs", "ens", "https"]);

export const ENSResolutionSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  contentTarget: z.string().optional(),
  avatar: z.string().optional(),
  records: z.record(z.string(), z.string()).optional(),
  status: z.enum(["resolving", "resolved", "unresolved", "invalid", "timeout"]),
});

export const IPFSResourceSchema = z.object({
  cid: z.string(),
  status: z.enum(["resolving", "fetching", "cached", "pinned", "unavailable", "invalid"]),
  cached: z.boolean(),
  pinned: z.boolean(),
  sizeBytes: z.number().optional(),
  gatewayUsed: z.string().optional(),
});

export const IPFSStorageStatsSchema = z.object({
  pinnedCount: z.number(),
  cacheSizeBytes: z.number(),
  pinnedSizeBytes: z.number(),
  availableBytes: z.number(),
});

export const PinRequestSchema = z.object({
  cid: z.string().min(1),
});

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  accent: z.string(),
  tabIds: z.array(z.string()),
  activeTabId: z.string().nullable(),
});

export const TabGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  tabIds: z.array(z.string()),
  collapsed: z.boolean(),
});

export const SubsystemHealthSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["ready", "running", "degraded", "unavailable", "error"]),
  details: z.string().optional(),
  lastChecked: z.number(),
});

export const RestartComponentRequestSchema = z.object({
  componentId: z.string().min(1),
});



