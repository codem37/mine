import { useEffect, useState } from "react";
import type { JSX } from "react";
import type { MediaSource } from "@mine/contracts";

interface Props {
  readonly source: MediaSource;
  readonly onOpenPlayer: (source: MediaSource) => void;
  readonly onDownload: (source: MediaSource) => void;
  readonly onClose: () => void;
}

export function MediaDetectionIndicator({ source, onOpenPlayer, onDownload, onClose }: Props): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse / hide toast after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCollapsed(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [source.id]);

  if (collapsed) return <></>;

  return (
    <div className="media-detect-toast" data-testid="media-detect-toast">
      <div className="media-detect-toast__capsule">
        <span className="media-detect-toast__icon">◉</span>
        <span className="media-detect-toast__title" title={source.title || "Media Detected"}>
          {source.title || "Media Detected"}
        </span>

        <button
          type="button"
          className="glass-btn glass-btn--sm"
          title="Play in Media Player"
          onClick={() => {
            onOpenPlayer(source);
            setCollapsed(true);
          }}
        >
          ▶ Play
        </button>

        <button
          type="button"
          className="glass-btn glass-btn--sm"
          title={source.isDrmProtected ? "Protected media — download unavailable" : "Download Media"}
          disabled={source.isDrmProtected}
          onClick={() => {
            if (!source.isDrmProtected) onDownload(source);
          }}
        >
          ↓ {source.isDrmProtected ? "Protected" : "Download"}
        </button>

        <button
          type="button"
          className="media-detect-toast__close"
          aria-label="Close indicator"
          onClick={() => {
            setCollapsed(true);
            onClose();
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
