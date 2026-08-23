import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface FilterSource {
  readonly name: string;
  readonly url: string;
  readonly optional: boolean;
  readonly category: "ads" | "trackers" | "mobile" | "custom";
}

/** Default bundled filter sources (curated, trusted, CC BY 4.0 or GPLv3) */
export const DEFAULT_FILTER_SOURCES: readonly FilterSource[] = [
  {
    name: "easylist",
    url: "https://easylist.to/easylist/easylist.txt",
    optional: false,
    category: "ads",
  },
  {
    name: "easyprivacy",
    url: "https://easylist.to/easylist/easyprivacy.txt",
    optional: false,
    category: "trackers",
  },
  {
    name: "ublock-filters",
    url: "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt",
    optional: false,
    category: "ads",
  },
  {
    name: "adguard-base",
    url: "https://filters.adtidy.org/extension/chromium/filters/2.txt",
    optional: true,
    category: "ads",
  },
  {
    name: "adguard-tracking",
    url: "https://filters.adtidy.org/extension/chromium/filters/3.txt",
    optional: true,
    category: "trackers",
  },
  {
    name: "adguard-mobile-ads",
    url: "https://filters.adtidy.org/extension/chromium/filters/11.txt",
    optional: true,
    category: "mobile",
  },
];

/** Kept separate so runtime additions don't mutate the const array */
const customSources: FilterSource[] = [];

/** Add a user-supplied filter list (URL must be HTTPS) */
export function addCustomSource(url: string): void {
  if (!url.startsWith("https://")) throw new Error("Custom filter list URLs must use HTTPS");
  const name = `custom:${new URL(url).hostname}-${Date.now()}`;
  if (customSources.some((s) => s.url === url)) return; // deduplicate
  customSources.push({ name, url, optional: true, category: "custom" });
}

/** Remove a user-supplied filter list by name */
export function removeCustomSource(name: string): void {
  const idx = customSources.findIndex((s) => s.name === name);
  if (idx !== -1) customSources.splice(idx, 1);
}

/** All active sources (default + custom) */
export function allSources(): readonly FilterSource[] {
  return [...DEFAULT_FILTER_SOURCES, ...customSources];
}

// ─── metadata cache ────────────────────────────────────────────────────────

/** Last-updated timestamps per list name (persisted alongside cache files) */
const lastUpdated = new Map<string, number>();
const ruleCountCache = new Map<string, number>();

export function recordListUpdate(name: string, ruleCount: number): void {
  lastUpdated.set(name, Date.now());
  ruleCountCache.set(name, ruleCount);
}

/** Build FilterListInfo-compatible objects for all sources */
export function getListInfo(): Array<{
  name: string;
  url: string;
  enabled: boolean;
  optional: boolean;
  category: string;
  lastUpdated: number | null;
  ruleCount: number;
}> {
  return allSources().map((s) => ({
    name: s.name,
    url: s.url,
    enabled: true, // all loaded sources are currently enabled
    optional: s.optional,
    category: s.category,
    lastUpdated: lastUpdated.get(s.name) ?? null,
    ruleCount: ruleCountCache.get(s.name) ?? 0,
  }));
}

// ─── fetch / cache ─────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 30_000;
const MAX_BYTES = 24 * 1024 * 1024;

export interface SourceOutcome {
  readonly name: string;
  readonly ok: boolean;
  readonly data: string | null;
  readonly error: string | null;
}

async function fetchOne(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "mine-browser/0.1 (shield updater)" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader !== null && Number.parseInt(lengthHeader, 10) > MAX_BYTES) {
    throw new Error("source larger than 24 MB cap");
  }
  const text = await response.text();
  if (text.length > MAX_BYTES) throw new Error("source larger than 24 MB cap");
  return text;
}

export async function fetchAllLists(
  sources: readonly FilterSource[] = DEFAULT_FILTER_SOURCES,
): Promise<SourceOutcome[]> {
  return await Promise.all(
    sources.map(async (source): Promise<SourceOutcome> => {
      try {
        const data = await fetchOne(source.url);
        const count = data.split("\n").filter((l) => {
          const t = l.trim();
          return t && !t.startsWith("!") && !t.startsWith("[");
        }).length;
        recordListUpdate(source.name, count);
        return { name: source.name, ok: true, data, error: null };
      } catch (error) {
        return {
          name: source.name,
          ok: false,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}

// ─── disk cache ────────────────────────────────────────────────────────────

export function resolveCacheDir(explicit?: string): string {
  if (explicit !== undefined && explicit.length > 0) return path.resolve(explicit);
  return path.join(process.cwd(), ".shield-cache");
}

export async function writeCache(cacheDir: string, name: string, data: string): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, `${name}.txt`), data, "utf8");
}

export async function readCache(cacheDir: string, name: string): Promise<string | null> {
  try {
    return await readFile(path.join(cacheDir, `${name}.txt`), "utf8");
  } catch {
    return null;
  }
}

/** Convenience alias kept for backward-compat with existing tests */
export const FILTER_SOURCES = DEFAULT_FILTER_SOURCES;
