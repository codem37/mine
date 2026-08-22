import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface FilterSource {
  readonly name: string;
  readonly url: string;
  readonly optional: boolean;
}

export const FILTER_SOURCES: readonly FilterSource[] = [
  {
    name: "easylist",
    url: "https://easylist.to/easylist/easylist.txt",
    optional: false,
  },
  {
    name: "ublock-filters",
    url: "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt",
    optional: false,
  },
  {
    name: "tracker-radar-us",
    url: "https://raw.githubusercontent.com/duckduckgo/tracker-radar/main/datasets/us/entity.json",
    optional: true,
  },
];

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
  if (
    lengthHeader !== null &&
    Number.parseInt(lengthHeader, 10) > MAX_BYTES
  ) {
    throw new Error("source larger than 24MB cap");
  }
  const text = await response.text();
  if (text.length > MAX_BYTES) {
    throw new Error("source larger than 24MB cap");
  }
  return text;
}

export async function fetchAllLists(
  sources: readonly FilterSource[] = FILTER_SOURCES,
): Promise<SourceOutcome[]> {
  return await Promise.all(
    sources.map(async (source): Promise<SourceOutcome> => {
      try {
        return {
          name: source.name,
          ok: true,
          data: await fetchOne(source.url),
          error: null,
        };
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

export function resolveCacheDir(explicit?: string): string {
  if (explicit !== undefined && explicit.length > 0) {
    return path.resolve(explicit);
  }
  return path.join(process.cwd(), ".shield-cache");
}

export async function writeCache(
  cacheDir: string,
  name: string,
  data: string,
): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, `${name}.txt`), data, "utf8");
}

export async function readCache(
  cacheDir: string,
  name: string,
): Promise<string | null> {
  try {
    return await readFile(path.join(cacheDir, `${name}.txt`), "utf8");
  } catch {
    return null;
  }
}
