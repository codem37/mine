import type { SafetyState } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly state?: SafetyState;
  readonly blockedCount?: number;
  readonly onClick: () => void;
}

export function ProtectionIndicator({ state = "safe", blockedCount = 0, onClick }: Props): JSX.Element {
  const isSuspicious = state === "suspicious" || state === "informational";
  const isDangerous = state === "dangerous" || state === "blocked";

  let icon = "🛡";
  let labelClass = "protection-indicator--safe";
  if (isDangerous) {
    icon = "⛔";
    labelClass = "protection-indicator--dangerous";
  } else if (isSuspicious) {
    icon = "⚠️";
    labelClass = "protection-indicator--suspicious";
  }

  return (
    <button
      type="button"
      className={`addressbar__shield ${labelClass}`}
      title={isDangerous ? "Dangerous threat blocked" : isSuspicious ? "Suspicious activity detected" : "Protection active"}
      onClick={onClick}
      data-testid="protection-indicator"
    >
      <span className="protection-indicator__icon">{icon}</span>
      {blockedCount > 0 ? (
        <span className="addressbar__shield-badge">{blockedCount}</span>
      ) : null}
    </button>
  );
}
