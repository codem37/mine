import type { LoadState, TabSnapshot } from "@mine/contracts";
import type { JSX } from "react";

// A tab is loading between the request leaving and the DOM settling;
// idle/loaded/failed all mean there is nothing in flight to stop.
const LOADING_STATES: ReadonlySet<LoadState> = new Set([
  "started",
  "committed",
  "dom-ready",
]);

interface Props {
  active: TabSnapshot | null;
}

export function NavControls({ active }: Props): JSX.Element {
  const tabId = active?.id ?? null;
  const loading = active !== null && LOADING_STATES.has(active.loadState);

  const goBack = (): void => {
    if (tabId !== null) void window.mine.goBack({ tabId });
  };
  const goForward = (): void => {
    if (tabId !== null) void window.mine.goForward({ tabId });
  };
  const reloadOrStop = (): void => {
    if (tabId === null) return;
    if (loading) {
      void window.mine.stop({ tabId });
    } else {
      void window.mine.reload({ tabId });
    }
  };

  return (
    <div className="navcontrols" role="group" aria-label="page navigation">
      <button
        className="navcontrols__btn"
        aria-label="go back"
        disabled={active?.canGoBack !== true}
        onClick={goBack}
      >
        {"\u2190"}
      </button>
      <button
        className="navcontrols__btn"
        aria-label="go forward"
        disabled={active?.canGoForward !== true}
        onClick={goForward}
      >
        {"\u2192"}
      </button>
      <button
        className="navcontrols__btn"
        aria-label={loading ? "stop loading" : "reload page"}
        disabled={active === null}
        onClick={reloadOrStop}
      >
        {loading ? "\u2715" : "\u27F3"}
      </button>
    </div>
  );
}
