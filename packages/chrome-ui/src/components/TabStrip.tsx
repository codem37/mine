import type { TabSnapshot, TabId } from "@mine/contracts";
import type { JSX } from "react";

const mine = window.mine;

interface Props {
  tabs: readonly TabSnapshot[];
  activeTabId: TabId | null;
}

export function TabStrip({ tabs, activeTabId }: Props): JSX.Element {
  const activeIndex = tabs.findIndex((t) => t.id === activeTabId);

  return (
    <div className="tabstrip" role="tablist" aria-label="open tabs">
      {tabs.map((tab, index) => {
        const offset = index - (activeIndex === -1 ? 0 : activeIndex);
        const angle = Math.max(-6, Math.min(6, offset * 1.5));
        const drop = Math.abs(offset) * 1.5;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            className={
              "tab" + (tab.id === activeTabId ? " tab--active" : "")
            }
            style={{
              transform: `rotate(${angle}deg) translateY(${drop}px)`,
            }}
            title={tab.title || tab.url}
            onClick={() => void mine.activateTab({ tabId: tab.id })}
          >
            <span className="tab__title">{tab.title || tab.url}</span>
            <span
              className="tab__close"
              role="button"
              aria-label={`close ${tab.title || tab.url}`}
              onClick={(e) => {
                e.stopPropagation();
                void mine.closeTab({ tabId: tab.id });
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
        onClick={() => void mine.newTab()}
      >
        +
      </button>
    </div>
  );
}
