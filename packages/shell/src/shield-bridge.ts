import {
  BlockedCounter,
  ShieldEngine,
  fetchAllLists,
  loadShieldNative,
  readCache,
  resolveCacheDir,
  writeCache,
} from "@mine/shield";
import { fileURLToPath } from "node:url";
import { FILTER_SOURCES } from "@mine/shield";

export interface BridgeSignal {
  readonly webContentsId: number | null;
}

export type SignalEmitter = (signal: BridgeSignal) => void;

const REQUEST_WINDOW_MS = 60_000;

export class RequestRate {
  private readonly timestamps: number[] = [];

  record(now = Date.now()): void {
    this.timestamps.push(now);
  }

  inLastMinute(now = Date.now()): number {
    const cutoff = now - REQUEST_WINDOW_MS;
    while (this.timestamps.length > 0) {
      const first = this.timestamps[0];
      if (first === undefined || first >= cutoff) break;
      this.timestamps.shift();
    }
    return this.timestamps.length;
  }
}

export interface ShieldBridge {
  engine: ShieldEngine;
  counts: BlockedCounter;
  requestRate: RequestRate;
  hookSession(session: Electron.Session): void;
  setEmitter(emit: SignalEmitter): void;
  start(): Promise<void>;
}

function nativeDirectory(): string {
  return fileURLToPath(
    new URL("../../shield/native/target/release/", import.meta.url),
  );
}

function isRequired(name: string): boolean {
  const source = FILTER_SOURCES.find((s) => s.name === name);
  return source !== undefined && !source.optional;
}

export function createShieldBridge(): ShieldBridge {
  const engine = new ShieldEngine();
  const counts = new BlockedCounter();
  const requestRate = new RequestRate();
  const native = loadShieldNative(nativeDirectory());
  if (native !== null) {
    engine.attachNative(new native.ShieldEngine());
  }

  let emit: SignalEmitter = () => {};

  engine.onStateChange(() => {
    emit({ webContentsId: null });
  });

  const hookSession = (target: Electron.Session): void => {
    target.webRequest.onBeforeRequest(
      { urls: ["http://*/*", "https://*/*"] },
      (details, callback) => {
        requestRate.record();
        try {
          let frameUrl = "";
          try {
            frameUrl = details.frame?.url ?? "";
          } catch {
            frameUrl = "";
          }
          const verdict = engine.checkRequest(
            details.url,
            frameUrl,
            String(details.resourceType),
          );
          if (!verdict.blocked) {
            callback({ cancel: false });
            return;
          }
          if (process.env.NODE_ENV !== "production") {
            console.debug("[Shield Blocked]", details.url, "Matched rule:", verdict.matchedFilter);
          }
          counts.increment();
          emit({
            webContentsId: details.webContentsId ?? null,
          });
          callback({ cancel: true });
        } catch {
          callback({ cancel: false });
        }
      },
    );
  };

  const start = async (): Promise<void> => {
    await engine.loadLists(async () => {
      const outcomes = await fetchAllLists();
      const cacheDir = resolveCacheDir(process.env.MINE_SHIELD_CACHE);
      const parts: string[] = [];
      for (const outcome of outcomes) {
        let data = outcome.data;
        if (data !== null) {
          void writeCache(cacheDir, outcome.name, data).catch(() => {});
        } else {
          data = await readCache(cacheDir, outcome.name);
        }
        if (data !== null) {
          parts.push(data);
        } else if (isRequired(outcome.name)) {
          throw new Error(
            `required filter source '${outcome.name}' unavailable: ${outcome.error ?? "unknown"}`,
          );
        }
      }
      return parts;
    });
  };

  return {
    engine,
    counts,
    requestRate,
    hookSession,
    setEmitter(fn: SignalEmitter): void {
      emit = fn;
    },
    start,
  };
}
