import { describe, expect, it } from "vitest";
import { IPC_CHANNELS, IPC_EVENTS } from "./channels.js";

function flattenStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  return Object.values(value as Record<string, unknown>).flatMap(flattenStrings);
}

describe("IPC channel names", () => {
  it("every channel matches the mine:<package>:<verb> format", () => {
    const names = [...flattenStrings(IPC_CHANNELS), ...flattenStrings(IPC_EVENTS)];
    for (const name of names) {
      expect(name).toMatch(/^mine:[a-z0-9-]+:[a-z0-9-]+$/);
    }
  });

  it("every channel name is unique across commands and events", () => {
    const names = [...flattenStrings(IPC_CHANNELS), ...flattenStrings(IPC_EVENTS)];
    expect(new Set(names).size).toBe(names.length);
  });
});
