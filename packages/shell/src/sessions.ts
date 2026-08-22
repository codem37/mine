import { session } from "electron";
import { buildSitePartition } from "@mine/contracts";

const cache = new Map<string, Electron.Session>();

export function defaultSession(): Electron.Session {
  return session.defaultSession;
}

export function sessionForHost(host: string): Electron.Session {
  const derived = buildSitePartition(host);
  if (!derived.ok) {
    throw new Error(
      `site partition derivation failed for host '${host}': ${derived.error.message}`,
    );
  }
  return sessionForPartitionName(derived.value);
}

export function sessionForPartitionName(name: string): Electron.Session {
  const existing = cache.get(name);
  if (existing) {
    return existing;
  }
  const created = session.fromPartition(name);
  created.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
  cache.set(name, created);
  return created;
}
