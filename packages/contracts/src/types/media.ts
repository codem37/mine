export const MEDIA_FORMATS = ["hls", "dash", "direct"] as const;

export type MediaFormat = (typeof MEDIA_FORMATS)[number];

export interface MediaStream {
  readonly id: string;
  readonly url: string;
  readonly mimeType: string;
  readonly format: MediaFormat;
  readonly title?: string;
  readonly isDrmProtected: boolean;
  readonly durationSeconds?: number | null;
}

export interface PlayNativeRequest {
  readonly streamId: string;
  readonly url: string;
  readonly title?: string;
}
