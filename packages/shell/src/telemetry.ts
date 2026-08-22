import os from "node:os";
import { app } from "electron";
import type { Telemetry } from "@mine/contracts";
import { TelemetrySchema } from "@mine/contracts";

const SAMPLE_MS = 1000;

export class TelemetrySampler {
  private timer: NodeJS.Timeout | null = null;
  private previousCpu: { percentCPUUsage: number } | null = null;
  private readonly coreCount = Math.max(1, os.cpus().length);

  constructor(
    private readonly sample: (snapshot: Telemetry) => void,
    private readonly netRequestsInLastMinute: () => number,
  ) {}

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      const proc = process as NodeJS.Process & {
        getCPUUsage(previousCPU?: {
          percentCPUUsage: number;
        }): { percentCPUUsage: number };
      };
      const usage = proc.getCPUUsage(this.previousCpu ?? undefined);
      this.previousCpu = usage;
      const cpuPercent =
        Math.abs(usage.percentCPUUsage) / this.coreCount;

      let ramKb = 0;
      for (const metric of app.getAppMetrics()) {
        ramKb += metric.memory.workingSetSize;
      }

      const snapshot = TelemetrySchema.parse({
        cpuPercent: clamp(cpuPercent, 0, 100),
        ramMb: Math.round((ramKb / 1024) * 10) / 10,
        gpuPercent: null,
        netRequestsPerMinute: this.netRequestsInLastMinute(),
      });
      this.sample(snapshot);
    }, SAMPLE_MS);
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
