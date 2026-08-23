import type { MediaSource } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly sources: readonly MediaSource[];
  readonly onOpenPlayer: () => void;
  readonly isPlaying?: boolean;
}

export function MediaIndicator({ sources, onOpenPlayer, isPlaying }: Props): JSX.Element | null {
  // Only render Media button when media is actively detected or playing
  if (sources.length === 0 && !isPlaying) {
    return null;
  }

  const count = sources.length;

  let label = "▶ Media";
  if (isPlaying) {
    label = "▶ Playing";
  } else if (count > 1) {
    label = `◉ Media (${count})`;
  }

  return (
    <button
      type="button"
      className={`glass-btn--pill media-indicator-btn ${isPlaying ? "media-indicator-btn--playing" : ""}`}
      title={count > 1 ? `${count} media streams detected — click to play` : "Media detected — click to launch Media Player"}
      onClick={onOpenPlayer}
      data-testid="media-indicator"
    >
      <span className="media-indicator__label">{label}</span>
    </button>
  );
}
