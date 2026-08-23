import type { JSX } from "react";

interface Props {
  readonly bytesPerSec?: number | null;
  readonly netRequestsPerMinute?: number | null;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  const val = Math.round((bytesPerSec / Math.pow(k, i)) * 10) / 10;
  return `${val} ${sizes[i]}`;
}

export function NetworkSpeedIndicator({ bytesPerSec = 0, netRequestsPerMinute = null }: Props): JSX.Element {
  const speedText = bytesPerSec && bytesPerSec > 0 
    ? formatSpeed(bytesPerSec) 
    : netRequestsPerMinute !== null 
      ? `${netRequestsPerMinute} req/m` 
      : "0 B/s";

  return (
    <div className="net-speed" title="Live Network Speed" data-testid="network-speed">
      <span className="net-speed__arrow" aria-hidden="true">↓</span>
      <span className="net-speed__value">{speedText}</span>
    </div>
  );
}
