import path from "node:path";

export function resolveSafe(root: string, requested: string): string | null {
  const decoded = decodeURIComponent(requested);
  const absolute = path.resolve(root, decoded);
  const relative = path.relative(root, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return absolute;
}
