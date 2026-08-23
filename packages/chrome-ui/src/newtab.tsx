import { useState } from "react";
import type { JSX } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StatNode } from "./components/StatNode.js";
import { useLiveStats } from "./use-live-stats.js";
import "./tokens.css";
import "./dash.css";

const PLANNED_LABEL = "planned";

interface SearchEngineOption {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly searchUrl: string;
}

const SEARCH_ENGINES: readonly SearchEngineOption[] = [
  { id: "duckduckgo", name: "DuckDuckGo", icon: "🦆", searchUrl: "https://duckduckgo.com/?q=" },
  { id: "searxng", name: "SearXNG", icon: "🔍", searchUrl: "http://localhost:8080/search?q=" },
  { id: "google", name: "Google", icon: "🌐", searchUrl: "https://www.google.com/search?q=" },
  { id: "brave", name: "Brave", icon: "🦁", searchUrl: "https://search.brave.com/search?q=" },
  { id: "bing", name: "Bing", icon: "🔎", searchUrl: "https://www.bing.com/search?q=" },
  { id: "startpage", name: "Startpage", icon: "🛡", searchUrl: "https://www.startpage.com/sp/search?query=" },
];

interface QuickLink {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly url: string;
}

const QUICK_LINKS: readonly QuickLink[] = [
  { id: "github", title: "GitHub", icon: "🐙", url: "https://github.com" },
  { id: "youtube", title: "YouTube", icon: "▶", url: "https://youtube.com" },
  { id: "searxng", title: "SearXNG", icon: "⌕", url: "http://localhost:8080" },
  { id: "downloads", title: "Downloads", icon: "↓", url: "mine://fetcher" },
  { id: "protection", title: "Protection", icon: "🛡", url: "mine://safety" },
  { id: "ipfs", title: "IPFS Network", icon: "🌐", url: "mine://ipfs" },
];

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

function GlassSearch(): JSX.Element {
  const [query, setQuery] = useState("");
  const [selectedEngine, setSelectedEngine] = useState<SearchEngineOption>(SEARCH_ENGINES[0]!);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { tabs } = useLiveStats();
  const activeTabId = tabs?.activeTabId ?? null;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const raw = query.trim();
    if (!raw || !activeTabId) return;

    const isDirectUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || raw.includes(".");
    const targetUrl = isDirectUrl
      ? (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
      : `${selectedEngine.searchUrl}${encodeURIComponent(raw)}`;

    void window.mine.navigate({ tabId: activeTabId, url: targetUrl });
  };

  const handleQuickLink = (url: string): void => {
    if (!activeTabId) return;
    void window.mine.navigate({ tabId: activeTabId, url });
  };

  return (
    <div className="dash-search-container">
      {/* Brand Logo Header */}
      <div className="dash-brand">
        <h1 className="dash-brand__title">mine</h1>
        <span className="dash-brand__subtitle">PRIVACY BROWSER</span>
      </div>

      {/* Main Glassmorphism Search Bar */}
      <form className="dash-glass-search" onSubmit={handleSubmit} data-testid="dash-glass-search">
        {/* Left Corner: Search Engine Selector */}
        <div className="search-engine-selector">
          <button
            type="button"
            className="search-engine-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={`Active Engine: ${selectedEngine.name} (Click to change)`}
          >
            <span className="search-engine__icon">{selectedEngine.icon}</span>
            <span className="search-engine__name">{selectedEngine.name}</span>
            <span className="search-engine__arrow">▾</span>
          </button>

          {dropdownOpen ? (
            <div className="search-engine-dropdown" onClick={() => setDropdownOpen(false)}>
              <div className="search-engine-dropdown__card" onClick={(e) => e.stopPropagation()}>
                <div className="search-engine-dropdown__header">Select Search Engine</div>
                {SEARCH_ENGINES.map((engine) => (
                  <button
                    key={engine.id}
                    type="button"
                    className={`search-engine-option ${engine.id === selectedEngine.id ? "search-engine-option--active" : ""}`}
                    onClick={() => {
                      setSelectedEngine(engine);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="search-engine-option__icon">{engine.icon}</span>
                    <span className="search-engine-option__name">{engine.name}</span>
                    {engine.id === selectedEngine.id ? <span className="search-engine-option__check">✓</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="search-input-divider" />

        {/* Center Search Input */}
        <input
          type="text"
          className="dash-glass-search__input"
          placeholder={`Search with ${selectedEngine.name} or enter URL...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <button type="submit" className="dash-glass-search__btn" title="Search">
          ➔
        </button>
      </form>

      {/* Quick Links Speed Dial */}
      <div className="quick-links-grid">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            className="quick-link-card"
            onClick={() => handleQuickLink(link.url)}
            title={link.title}
          >
            <div className="quick-link__icon">{link.icon}</div>
            <div className="quick-link__title">{link.title}</div>
          </button>
        ))}
      </div>

      <LiveStatsStrip />
    </div>
  );
}

function LiveStatsStrip(): JSX.Element {
  const { tabs, shield } = useLiveStats();
  const active = tabs?.tabs.find((t) => t.id === tabs.activeTabId) ?? null;
  return (
    <dl className="dash-live-stats" aria-label="live browser stats">
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
        testId="dash-blocked"
      />
    </dl>
  );
}

export function NewTabDashboard(): JSX.Element {
  return (
    <main className="dash">
      <AtmosphericParticles />
      <GlassSearch />
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
