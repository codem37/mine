import type { LoadState } from "@mine/contracts";

export type TabEventName =
  | "none"
  | "start"
  | "navigate"
  | "in-page"
  | "dom-ready"
  | "finish"
  | "fail";

export function toLoadState(event: TabEventName): LoadState {
  switch (event) {
    case "start":
      return "started";
    case "navigate":
    case "in-page":
      return "committed";
    case "dom-ready":
      return "dom-ready";
    case "finish":
      return "loaded";
    case "fail":
      return "failed";
    case "none":
      return "idle";
  }
}
