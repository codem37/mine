import type { TabSnapshot, TabId } from "@mine/contracts";
import type { JSX } from "react";

const LOADING_STATES = new Set(["started", "committed", "dom-ready"]);

interface Props {
  tabs: readonly TabSnapshot[];
  activeTabId: TabId | null;
}

/** Extract a single emoji-letter from a URL's hostname as a favicon placeholder. */
function siteInitial(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.charAt(0).toUpperCase();
  } catch {
    return "●";
  }
}

export function TabStrip({ tabs, activeTabId }: Props): JSX.Element {
  return (
    <div className="tabstrip" role="tablist" aria-label="open tabs">
      {tabs.map((tab) => {
        const loading = LOADING_STATES.has(tab.loadState);
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            className={
              "tab" +
              (tab.id === activeTabId ? " tab--active" : "") +
              (loading ? " tab--loading" : "")
            }
            title={tab.title || tab.url}
            onClick={() => void window.mine.activateTab({ tabId: tab.id })}
          >
            <span className="tab__icon" aria-hidden="true">
              {siteInitial(tab.url)}
            </span>
            <span className="tab__title">{tab.title || tab.url}</span>
            <span
              className="tab__close"
              role="button"
              aria-label={`close ${tab.title || tab.url}`}
              onClick={(e) => {
                e.stopPropagation();
                void window.mine.closeTab({ tabId: tab.id });
              }}
            >
              ×
            </span>
          </button>
        );
      })}
      <button
        className="tabstrip__new"
        aria-label="new tab"
        onClick={() => void window.mine.newTab()}
      >
        +
      </button>
    </div>
  );
}
