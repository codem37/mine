import { useState, useEffect } from "react";
import type { TabSnapshot, TabId } from "@mine/contracts";
import type { JSX } from "react";

const LOADING_STATES = new Set(["started", "committed", "dom-ready"]);

interface Props {
  readonly tabs: readonly TabSnapshot[];
  readonly activeTabId: TabId | null;
}

/** Extract a single symbol/letter from a URL as a fallback favicon placeholder. */
function siteInitial(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "mine:") return "?";
    const host = parsed.hostname.replace(/^www\./, "");
    return host.charAt(0).toUpperCase() || "●";
  } catch {
    return "●";
  }
}

function TabIcon({ url, favicons }: { readonly url: string; readonly favicons?: readonly string[] }): JSX.Element {
  const [loadError, setLoadError] = useState(false);
  const src = favicons?.[0];

  useEffect(() => {
    setLoadError(false);
  }, [src]);

  if (!src || loadError) {
    return <>{siteInitial(url)}</>;
  }

  return (
    <img
      src={src}
      alt=""
      className="tab__favicon"
      onError={() => setLoadError(true)}
    />
  );
}

export function TabStrip({ tabs, activeTabId }: Props): JSX.Element {
  const isCompact = tabs.length > 8;

  return (
    <div
      className={`tabstrip ${isCompact ? "tabstrip--compact" : ""}`}
      role="tablist"
      aria-label="open tabs"
    >
      <button
        type="button"
        className="tabstrip__new glass-btn"
        aria-label="new tab"
        title="New Tab"
        onClick={() => void window.mine.newTab()}
      >
        +
      </button>

      <div className="tabstrip__list">
        {tabs.map((tab) => {
          const loading = LOADING_STATES.has(tab.loadState);
          const isActive = tab.id === activeTabId;
          const displayTitle = tab.title || tab.url;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={
                "tab-capsule" +
                (isActive ? " tab-capsule--active tab--active" : "") +
                (loading ? " tab-capsule--loading tab--loading" : "")
              }
              title={displayTitle}
              onClick={() => void window.mine.activateTab({ tabId: tab.id })}
            >
              <span className="tab-capsule__icon" aria-hidden="true">
                <TabIcon url={tab.url} favicons={tab.favicons} />
              </span>
              <span className="tab-capsule__title">{displayTitle}</span>
              <span
                className="tab-capsule__close"
                role="button"
                aria-label={`close ${displayTitle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  void window.mine.closeTab({ tabId: tab.id });
                }}
              >
                ✕
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
