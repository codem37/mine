import { session } from "electron";
import { buildSitePartition } from "@mine/contracts";

type SessionHook = (session: Electron.Session) => void;

const cache = new Map<string, Electron.Session>();
const hooks: SessionHook[] = [];
const hookedSessions = new WeakSet<Electron.Session>();

export function registerSessionHook(hook: SessionHook): void {
  hooks.push(hook);
  for (const existing of cache.values()) {
    runHooks(existing);
  }
}

function runHooks(target: Electron.Session): void {
  if (hookedSessions.has(target)) return;
  hookedSessions.add(target);
  for (const hook of hooks) {
    hook(target);
  }
}

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
  runHooks(created);
  return created;
}
