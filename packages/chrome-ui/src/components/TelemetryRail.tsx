import type { ShieldStats, Telemetry } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  telemetry: Telemetry | null;
  shield: ShieldStats | null;
}

export function TelemetryRail({ telemetry, shield }: Props): JSX.Element {
  const engine = shield?.engineState ?? "uninitialised";
  return (
    <aside className="rail" aria-label="telemetry">
      <h2 className="rail__heading">telemetry</h2>
      <dl className="rail__grid">
        <dt>cpu</dt>
        <dd data-testid="cpu">{fmt(telemetry?.cpuPercent, "%")}</dd>
        <dt>ram</dt>
        <dd>{fmt(telemetry?.ramMb, " MB")}</dd>
        <dt>net/min</dt>
        <dd>
          {telemetry === null ? "…" : String(telemetry.netRequestsPerMinute)}
        </dd>
        <dt>gpu</dt>
        <dd>n/a</dd>
      </dl>

      <h2 className="rail__heading">shield</h2>
      <p className="rail__shield">
        <span
          className={
            "rail__state" +
            (engine === "ready" ? "" : ` rail__state--${engine}`)
          }
        >
          {engine}
        </span>
        <span className="rail__count" data-testid="blocked">
          {shield?.blockedCount ?? 0}
        </span>
        blocked
      </p>
    </aside>
  );
}

function fmt(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return "…";
  return `${Math.round(value * 10) / 10}${unit}`;
}
