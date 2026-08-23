import type { MediaSource } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly sources: readonly MediaSource[];
  readonly onOpenBubble: () => void;
  readonly isPlaying?: boolean;
}

export function MediaIndicator({ sources, onOpenBubble, isPlaying }: Props): JSX.Element | null {
  if (sources.length === 0) return null;

  const count = sources.length;

  return (
    <button
      type="button"
      className={`glass-btn glass-btn--sm media-indicator-btn ${isPlaying ? "media-indicator-btn--playing" : ""}`}
      title={count > 1 ? `${count} media items available` : "Media available"}
      onClick={onOpenBubble}
      data-testid="media-indicator"
    >
      <span className="media-indicator__icon">◉</span>
      {count > 1 ? <span className="media-indicator__count">{count}</span> : null}
    </button>
  );
}
