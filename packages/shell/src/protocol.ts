import { net, protocol } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveSafe } from "./core/protocol-path.js";

export function declarePrivilegedScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "mine",
      privileges: { standard: true, secure: true, supportFetchAPI: true },
    },
  ]);
}

export function chromeAssetRoot(): string {
  const override = process.env.MINE_CHROME_DIR;
  if (override !== undefined && override.length > 0) {
    return path.resolve(override);
  }
  return fileURLToPath(new URL("../../chrome-ui/dist/", import.meta.url));
}

export function attachChromeProtocol(
  target: Electron.Session,
  root: string,
): void {
  target.protocol.handle("mine", async (request) => {
    const url = new URL(request.url);
    let rel = url.pathname.replace(/^\/+/, "");
    if (rel === "") {
      if (url.host === "newtab") {
        rel = "newtab.html";
      } else if (url.host === "fetcher" || url.host === "downloads") {
        rel = "fetcher.html";
      } else {
        rel = "index.html";
      }
    }
    const resolved = resolveSafe(root, rel);
    if (resolved === null) {
      return new Response("forbidden", { status: 403 });
    }
    try {
      return await net.fetch(pathToFileURL(resolved).toString());
    } catch {
      return new Response("not found", { status: 404 });
    }
  });
}
