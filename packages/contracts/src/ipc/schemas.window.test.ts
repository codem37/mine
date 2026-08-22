import { describe, expect, it } from "vitest";
import {
  TelemetrySchema,
  UnitRequestSchema,
  WindowStateSchema,
} from "./schemas.js";
import type { Telemetry } from "./schemas.js";

describe("UnitRequestSchema", () => {
  it("accepts the empty payload window controls send", () => {
    expect(() => UnitRequestSchema.parse({})).not.toThrow();
  });

  it("rejects smuggled extra keys", () => {
    expect(() => UnitRequestSchema.parse({ evil: true })).toThrow();
  });
});

describe("WindowStateSchema", () => {
  it("tracks maximized as a boolean only", () => {
    expect(WindowStateSchema.parse({ maximized: true }).maximized).toBe(true);
    expect(() => WindowStateSchema.parse({ maximized: "yes" })).toThrow();
  });
});

describe("TelemetrySchema", () => {
  it("accepts honest nulls for metrics we cannot measure truthfully", () => {
    const sample: Telemetry = {
      cpuPercent: 12.5,
      ramMb: 512,
      gpuPercent: null,
      netRequestsPerMinute: 42,
    };
    expect(() => TelemetrySchema.parse(sample)).not.toThrow();
  });

  it("rejects percentages outside 0..100", () => {
    expect(() =>
      TelemetrySchema.parse({
        cpuPercent: 137,
        ramMb: 0,
        gpuPercent: null,
        netRequestsPerMinute: 0,
      }),
    ).toThrow();
  });

  it("refuses a fake gpu number — gpuPercent is null until honestly measurable", () => {
    expect(() =>
      TelemetrySchema.parse({
        cpuPercent: 0,
        ramMb: 0,
        gpuPercent: 42.7,
        netRequestsPerMinute: 0,
      }),
    ).toThrow();
  });
});
