import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";

export interface NativeVerdict {
  readonly blocked: boolean;
  readonly matchedFilter: string | null;
}

export interface ShieldEngineNative {
  replaceFilters(lists: string[]): void;
  check(
    url: string,
    sourceUrl: string,
    resourceType: string,
  ): NativeVerdict;
}

const LIB_EXT: Record<string, string> = {
  win32: "dll",
  darwin: "dylib",
  linux: "so",
};

const CANDIDATES = ["mine-shield.node", "index.node", `mine_shield.${LIB_EXT[process.platform] ?? ""}`];

export function loadShieldNative(dir: string): ShieldEngineNative | null {
  const require = createRequire(import.meta.url);
  for (const name of CANDIDATES) {
    if (name.length === 0) continue;
    const full = path.join(dir, name);
    if (!existsSync(full)) continue;
    try {
      const mod = require(full) as {
        default?: ShieldEngineNative;
      } & ShieldEngineNative;
      return mod.default ?? mod;
    } catch {
      continue;
    }
  }
  return null;
}
