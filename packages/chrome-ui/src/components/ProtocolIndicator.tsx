import type { ProtocolType } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly protocol: ProtocolType;
  readonly label: string;
  readonly onClick: () => void;
}

export function ProtocolIndicator({ protocol, label, onClick }: Props): JSX.Element {
  if (protocol === "https") return <></>;

  const badgeText = protocol === "ens" ? "ENS" : "IPFS";

  return (
    <button
      type="button"
      className="protocol-indicator-pill"
      onClick={onClick}
      title={`Click for ${badgeText} Protocol Information`}
      data-testid="protocol-indicator"
    >
      <span className="protocol-indicator__badge">{badgeText}</span>
      <span className="protocol-indicator__label">{label}</span>
    </button>
  );
}
