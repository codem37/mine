/**
 * GhosteryAdapter — wraps @ghostery/adblocker FiltersEngine as a NativeEngineLike.
 * Implements both network blocking and cosmetic (CSS element hiding) filtering.
 *
 * No secrets, cookies, or credentials ever pass through this layer.
 * URL query strings are NOT logged in any error path.
 */
import { FiltersEngine, Request } from "@ghostery/adblocker";
import type { NativeEngineLike } from "./engine.js";

/** Maps Electron/Chromium resource types to @ghostery/adblocker RequestType strings */
const RESOURCE_TYPE_MAP: Record<string, string> = {
  mainFrame: "document",
  subFrame: "sub_frame",
  stylesheet: "stylesheet",
  script: "script",
  image: "image",
  font: "font",
  object: "object",
  xmlHttpRequest: "xhr",
  ping: "ping",
  cspReport: "csp_report",
  media: "media",
  webSocket: "websocket",
  other: "other",
  // Common aliases
  fetch: "xhr",
  xhr: "xhr",
};

function toRequestType(type: string): string {
  return RESOURCE_TYPE_MAP[type] ?? "other";
}

/** Extract hostname from URL without leaking credentials or query strings */
function safeHostname(urlString: string): string {
  try {
    return new URL(urlString).hostname;
  } catch {
    return "";
  }
}

export class GhosteryAdapter implements NativeEngineLike {
  #engine: FiltersEngine | null = null;
  #networkRules = 0;
  #cosmeticRules = 0;

  get networkRules(): number {
    return this.#networkRules;
  }

  get cosmeticRules(): number {
    return this.#cosmeticRules;
  }

  replaceFilters(lists: string[]): void {
    const combined = lists.join("\n");
    this.#engine = FiltersEngine.parse(combined, {
      debug: false,
      enableCompression: false,
    });

    // Estimate rule counts from raw content lines
    let net = 0;
    let cos = 0;
    for (const line of combined.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("!") || trimmed.startsWith("[")) continue;
      if (trimmed.includes("##") || trimmed.includes("#?#") || trimmed.includes("#$#")) {
        cos++;
      } else {
        net++;
      }
    }
    this.#networkRules = net;
    this.#cosmeticRules = cos;
  }

  check(
    url: string,
    sourceUrl: string,
    resourceType: string,
  ): { blocked: boolean; matchedFilter: string | null } {
    if (this.#engine === null) {
      return { blocked: false, matchedFilter: null };
    }
    try {
      const request = Request.fromRawDetails({
        url,
        sourceUrl: sourceUrl || url,
        type: toRequestType(resourceType) as any,
      });
      const match = this.#engine.match(request);
      return {
        blocked: match.match,
        matchedFilter: match.filter ? String(match.filter.toString()) : null,
      };
    } catch {
      // Never log URL details — could contain credentials
      return { blocked: false, matchedFilter: null };
    }
  }

  /**
   * Returns an array of CSS selector strings (e.g. ".ad-banner", "#tracker-div")
   * to inject as `display: none !important` into the page at pageUrl.
   * No network I/O — purely in-process rule lookup.
   */
  getCosmeticSelectors(pageUrl: string): string[] {
    if (this.#engine === null) return [];
    try {
      const hostname = safeHostname(pageUrl);
      if (!hostname) return [];
      const { styles } = this.#engine.getCosmeticsFilters({
        url: pageUrl,
        hostname,
        domain: hostname.split(".").slice(-2).join("."),
        getBaseRules: true,
        getInjectionRules: false,
        getExtendedRules: false,
        getRulesFromDOM: false,
        getRulesFromHostname: true,
      });
      if (!styles) return [];
      // styles is a CSS string like ".ad-banner, .tracker { display: none !important; }"
      // Extract selectors for caller to re-inject in controlled form
      const match = styles.match(/^(.+?)\s*\{\s*display:\s*none/ms);
      const selectorGroup = match?.[1];
      if (!selectorGroup) return [styles];
      return selectorGroup
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Returns full CSS ready to inject (all cosmetic rules combined for pageUrl).
   */
  getCosmeticCSS(pageUrl: string): string {
    if (this.#engine === null) return "";
    try {
      const hostname = safeHostname(pageUrl);
      if (!hostname) return "";
      const { styles } = this.#engine.getCosmeticsFilters({
        url: pageUrl,
        hostname,
        domain: hostname.split(".").slice(-2).join("."),
        getBaseRules: true,
        getInjectionRules: false,
        getExtendedRules: false,
        getRulesFromDOM: false,
        getRulesFromHostname: true,
      });
      return styles ?? "";
    } catch {
      return "";
    }
  }
}
