import type { ShieldEngineState, ShieldStats, Telemetry } from "@mine/contracts";
import type { JSX } from "react";
import { StatNode } from "./StatNode.js";
import type { StatTone } from "./StatNode.js";

interface Props {
  telemetry: Telemetry | null;
  shield: ShieldStats | null;
}

const ENGINE_TONE: Record<ShieldEngineState, StatTone> = {
  ready: "ok",
  loading: "warn",
  failed: "error",
  uninitialised: "neutral",
};

function rounded(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(Math.round(value * 10) / 10);
}

export function TelemetryRail({ telemetry, shield }: Props): JSX.Element {
  const engineState: ShieldEngineState | null =
    shield?.engineState ?? null;
  const shieldOff = shield?.enabled === false;
  return (
    <aside className="rail" aria-label="telemetry">
      <h2 className="rail__heading">telemetry</h2>
      <dl className="rail__grid">
        <StatNode
          label="cpu"
          value={rounded(telemetry?.cpuPercent)}
          unit="%"
          testId="cpu"
        />
        <StatNode label="ram" value={rounded(telemetry?.ramMb)} unit=" MB" />
        <StatNode
          label="net/min"
          value={telemetry === null ? null : String(telemetry.netRequestsPerMinute)}
          testId="net"
        />
        <StatNode
          label="gpu"
          value={null}
          detail={
            telemetry === null ? null : "gpu sampling not built yet"
          }
        />
      </dl>

      <h2 className="rail__heading">shield</h2>
      <dl className="rail__grid">
        <StatNode
          label="engine"
          value={engineState}
          tone={
            engineState === null || shieldOff
              ? "neutral"
              : ENGINE_TONE[engineState]
          }
          detail={
            shield?.lastError ?? (shieldOff ? "protection off" : null)
          }
          testId="engine-state"
        />
        <StatNode
          label="blocked"
          value={shield === null ? null : String(shield.blockedCount)}
          size="large"
          testId="blocked"
        />
      </dl>
    </aside>
  );
}
