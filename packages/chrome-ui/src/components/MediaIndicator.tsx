import type { MediaStream } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly streams: readonly MediaStream[];
  readonly onOpenPiP: () => void;
}

export function MediaIndicator({ streams, onOpenPiP }: Props): JSX.Element | null {
  if (streams.length === 0) return null;

  const hasDrm = streams.some((s) => s.isDrmProtected);

  return (
    <button
      type="button"
      className="glass-btn glass-btn--sm glass-btn--primary media-indicator-btn"
      title={hasDrm ? "Media stream detected (DRM Protected)" : `${streams.length} media stream(s) detected`}
      onClick={onOpenPiP}
    >
      🎬 {streams.length} {hasDrm ? "🔒" : ""}
    </button>
  );
}
