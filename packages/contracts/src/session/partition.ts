import type { AppError } from "../types/app-error.js";
import { err, ok } from "../types/result.js";
import type { Result } from "../types/result.js";

export const SITE_PARTITION_PREFIX = "persist:site-";

export function buildSitePartition(rawHost: string): Result<string, AppError> {
  const host = rawHost.trim().toLowerCase();
  let name: string;
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    name = end === -1 ? "" : host.slice(1, end);
  } else {
    name = host.split(":")[0] ?? "";
  }
  if (name.length === 0) {
    return err({
      kind: "invalid-input",
      message: "cannot derive a site partition from an empty host",
      details: { host: rawHost },
    });
  }
  return ok(SITE_PARTITION_PREFIX + name);
}
