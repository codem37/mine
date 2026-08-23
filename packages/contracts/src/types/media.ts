export const MEDIA_FORMATS = ["hls", "dash", "direct"] as const;
export type MediaFormat = (typeof MEDIA_FORMATS)[number];

export interface MediaQuality {
  readonly label: string; // e.g. "1080p", "720p", "Auto"
  readonly bitrateBps?: number;
  readonly width?: number;
  readonly height?: number;
}

export interface MediaTrack {
  readonly id: string;
  readonly label: string;
  readonly language?: string;
  readonly isDefault?: boolean;
}

export interface MediaSource {
  readonly id: string;
  readonly url: string;
  readonly mimeType: string;
  readonly format: MediaFormat;
  readonly title?: string;
  readonly isDrmProtected: boolean;
  readonly isLive: boolean;
  readonly durationSeconds?: number | null;
  readonly qualities: readonly MediaQuality[];
  readonly audioTracks: readonly MediaTrack[];
  readonly subtitleTracks: readonly MediaTrack[];
  readonly playbackPosition?: number;
  readonly thumbnailUrl?: string;
}

export type PlayerStatus = "idle" | "buffering" | "playing" | "paused" | "ended" | "error";
export type LoopState = "off" | "single" | "range";

export interface PlaybackDiagnostics {
  readonly decoder: string;
  readonly renderer: string;
  readonly droppedFrames: number;
  readonly renderedFrames: number;
  readonly hwDecoding: boolean;
  readonly audioVideoSyncMs: number;
}

export interface PlayerState {
  readonly sourceId: string | null;
  readonly status: PlayerStatus;
  readonly currentTime: number;
  readonly duration: number;
  readonly bufferedSeconds: number;
  readonly volume: number;
  readonly muted: boolean;
  readonly playbackRate: number; // 0.25 to 3.0
  readonly activeQuality: string;
  readonly activeAudioTrack: string | null;
  readonly activeSubtitleTrack: string | null;
  readonly subtitleOffsetSeconds: number;
  readonly audioOffsetSeconds: number;
  readonly loopState: LoopState;
  readonly loopRange: readonly [number, number] | null;
  readonly currentFrame: number;
  readonly frameFps: number;
  readonly fullscreen: boolean;
  readonly diagnostics: PlaybackDiagnostics;
}

export interface PlayNativeRequest {
  readonly streamId: string;
  readonly url: string;
  readonly title?: string;
}

export interface MediaControlRequest {
  readonly action: "play" | "pause" | "seek" | "setVolume" | "setMute" | "setSpeed" | "setQuality" | "setSubtitle" | "setAudioTrack" | "setABLoop" | "stepFrame" | "setSubtitleOffset" | "setAudioOffset";
  readonly value?: number | string | boolean | readonly [number, number] | null;
}

export interface LoadSubtitleRequest {
  readonly filePath: string;
  readonly label?: string;
}

export interface MediaItemDownloadRequest {
  readonly sourceId: string;
  readonly url: string;
  readonly title: string;
  readonly quality?: string;
  readonly format?: MediaFormat;
}
