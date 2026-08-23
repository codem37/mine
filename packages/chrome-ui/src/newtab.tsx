import { useState } from "react";
import type { JSX } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StatNode } from "./components/StatNode.js";
import { useLiveStats } from "./use-live-stats.js";
import "./tokens.css";
import "./dash.css";

const PLANNED_LABEL = "planned";

function nodePosition(index: number, total: number, radius: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / Math.max(1, total)) * Math.PI * 2;
  return { x: 200 + radius * Math.cos(angle), y: 190 + radius * Math.sin(angle) };
}

interface DashNode {
  readonly label: string;
  readonly hint?: string;
  readonly action?: () => void;
}

const LIVE_NODES: readonly DashNode[] = [
  { label: "new tab", hint: "opens a fresh tab", action: (): void => { void window.mine.newTab(); } },
];

const FUTURE_NODES: readonly DashNode[] = [
  { label: "downloads" },
  { label: "search" },
  { label: "safety" },
  { label: "ipfs" },
];

function LiveStatsStrip(): JSX.Element {
  const { tabs, shield } = useLiveStats();
  const active =
    tabs?.tabs.find((t) => t.id === tabs.activeTabId) ?? null;
  return (
    <dl className="dash__stats" aria-label="live browser stats">
      <StatNode
        label="tabs open"
        value={tabs === null ? null : String(tabs.tabs.length)}
        testId="dash-tabs"
      />
      <StatNode
        label="active tab"
        value={active === null ? null : active.title || active.url}
        testId="dash-active-tab"
      />
      <StatNode
        label="shield blocked"
        value={shield === null ? null : String(shield.blockedCount)}
        tone={shield?.engineState === "failed" ? "error" : "ok"}
        detail={
          shield?.engineState === "failed" ? (shield.lastError ?? null) : null
        }
        testId="dash-blocked"
      />
    </dl>
  );
}

function AtmosphericParticles(): JSX.Element {
  return (
    <div className="dash__particles" aria-hidden="true">
      <div className="dash__particle dash__particle--1" />
      <div className="dash__particle dash__particle--2" />
      <div className="dash__particle dash__particle--3" />
      <div className="dash__particle dash__particle--4" />
    </div>
  );
}

function CenterSearch(): JSX.Element {
  const [query, setQuery] = useState("");
  const { tabs } = useLiveStats();

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const raw = query.trim();
    if (!raw) return;
    const activeTabId = tabs?.activeTabId ?? null;
    if (!activeTabId) return;
    const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
      ? raw
      : `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
    void window.mine.navigate({ tabId: activeTabId, url });
  };

  return (
    <form className="dash__search" onSubmit={handleSubmit}>
      <span className="dash__search-icon" aria-hidden="true">🔍</span>
      <input
        type="text"
        className="dash__search-input"
        placeholder="Search the web or type a URL..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
    </form>
  );
}

export function NewTabDashboard(): JSX.Element {
  const all = [...LIVE_NODES, ...FUTURE_NODES];
  return (
    <main className="dash">
      <AtmosphericParticles />
      <div className="dash__panel">
        <CenterSearch />

        <svg viewBox="0 0 400 380" className="dash__radial" role="group" aria-label="feature nodes">
          <circle cx="200" cy="190" r="150" className="dash__orbit" />
          <circle cx="200" cy="190" r="90" className="dash__orbit dash__orbit--inner" />
          <text x="200" y="185" textAnchor="middle" className="dash__core">
            mine
          </text>
          <text x="200" y="203" textAnchor="middle" className="dash__core-sub">
            privacy browser
          </text>
          {all.map((node, i) => {
            const pos = nodePosition(i, all.length, 150);
            const live = i < LIVE_NODES.length && node.action !== undefined;
            return live ? (
              <g
                key={node.label}
                className="dash__node"
                tabIndex={0}
                role="button"
                aria-label={node.label}
                onClick={node.action}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") node.action?.();
                }}
              >
                <circle cx={pos.x} cy={pos.y} r="34" />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle">
                  {node.label}
                </text>
              </g>
            ) : (
              <g key={node.label} className="dash__node dash__node--future">
                <circle cx={pos.x} cy={pos.y} r="30" />
                <text x={pos.x} y={pos.y - 2} textAnchor="middle">
                  {node.label}
                </text>
                <text x={pos.x} y={pos.y + 14} textAnchor="middle" className="dash__planned">
                  {PLANNED_LABEL}
                </text>
              </g>
            );
          })}
        </svg>
        <LiveStatsStrip />
        <p className="dash__note">type an address or search above — dimmed nodes are planned</p>
      </div>
    </main>
  );
}

const root = document.getElementById("root");
if (root !== null) {
  createRoot(root).render(
    <StrictMode>
      <NewTabDashboard />
    </StrictMode>,
  );
}
