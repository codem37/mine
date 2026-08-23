import type { MediaSource } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly sources: readonly MediaSource[];
  readonly onOpenBubble: () => void;
  readonly isPlaying?: boolean;
}

export function MediaIndicator({ sources, onOpenBubble, isPlaying }: Props): JSX.Element {
  const count = sources.length;

  let label = "○";
  if (isPlaying) {
    label = "▶";
  } else if (count > 1) {
    label = `● ${count}`;
  } else if (count === 1) {
    label = "●";
  }

  return (
    <button
      type="button"
      className={`glass-btn glass-btn--sm media-indicator-btn ${isPlaying ? "media-indicator-btn--playing" : count > 0 ? "media-indicator-btn--detected" : ""}`}
      title={count === 0 ? "Media Center" : count > 1 ? `${count} media streams detected` : "Media detected"}
      onClick={onOpenBubble}
      data-testid="media-indicator"
    >
      <span className="media-indicator__label">{label}</span>
    </button>
  );
}
