export const SHIELD_ENGINE_STATES = [
  "uninitialised",
  "loading",
  "ready",
  "failed",
] as const;

export type ShieldEngineState = (typeof SHIELD_ENGINE_STATES)[number];

export interface RequestVerdict {
  readonly blocked: boolean;
  readonly matchedFilter: string | null;
}
