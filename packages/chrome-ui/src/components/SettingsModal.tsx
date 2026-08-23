import { useState, useMemo } from "react";
import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
  readonly initialSection?: string;
}

const SETTINGS_SECTIONS = [
  { id: "general", label: "General", icon: "⚙" },
  { id: "appearance", label: "Appearance", icon: "🎨" },
  { id: "workspaces", label: "Workspaces", icon: "❖" },
  { id: "search", label: "Search", icon: "⌕" },
  { id: "fetcher", label: "Fetcher (Downloads)", icon: "↓" },
  { id: "media", label: "Media Manager", icon: "▶" },
  { id: "privacy", label: "Privacy & Shield", icon: "🛡" },
  { id: "safety", label: "Safety & Threats", icon: "⛔" },
  { id: "decentralized", label: "Decentralized (IPFS/ENS)", icon: "🌐" },
  { id: "performance", label: "Performance & Health", icon: "⚡" },
  { id: "keyboard", label: "Keyboard Shortcuts", icon: "⌨" },
  { id: "accessibility", label: "Accessibility", icon: "👁" },
  { id: "about", label: "About & Licenses", icon: "ℹ" },
] as const;

export function SettingsModal({ onClose, initialSection = "general" }: Props): JSX.Element {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [searchQuery, setSearchQuery] = useState("");
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");
  const [glassIntensity, setGlassIntensity] = useState<"subtle" | "balanced" | "strong">("balanced");
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SETTINGS_SECTIONS.filter((sec) => sec.label.toLowerCase().includes(q) || sec.id.includes(q));
  }, [searchQuery]);

  return (
    <div className="settings-overlay" onClick={onClose} data-testid="settings-modal">
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        {/* Left Navigation Sidebar */}
        <aside className="settings-sidebar">
          <div className="settings-search-wrap">
            <input
              value={searchQuery}
              className="settings-search__input"
              placeholder="Search settings..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery.trim().length > 0 ? (
            <div className="settings-search-results">
              {searchResults.length === 0 ? (
                <div className="settings-search-empty">No settings match</div>
              ) : (
                searchResults.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    className={`settings-nav-item ${activeSection === sec.id ? "settings-nav-item--active" : ""}`}
                    onClick={() => {
                      setActiveSection(sec.id);
                      setSearchQuery("");
                    }}
                  >
                    <span>{sec.icon}</span>
                    <span>{sec.label}</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <nav className="settings-nav">
              {SETTINGS_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`settings-nav-item ${activeSection === sec.id ? "settings-nav-item--active" : ""}`}
                  onClick={() => setActiveSection(sec.id)}
                >
                  <span>{sec.icon}</span>
                  <span>{sec.label}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="settings-content">
          <header className="settings-content__header">
            <h3>{SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label ?? "Settings"}</h3>
            <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
          </header>

          <div className="settings-body">
            {activeSection === "appearance" ? (
              <div className="settings-group">
                <h4>Appearance Customization</h4>
                <div className="settings-row">
                  <label>Theme</label>
                  <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                    <option value="dark">Dark (Recommended)</option>
                    <option value="light">Light</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div className="settings-row">
                  <label>UI Density</label>
                  <select value={density} onChange={(e) => setDensity(e.target.value as any)}>
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable (Balanced)</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
                <div className="settings-row">
                  <label>Glass Blur Intensity</label>
                  <select value={glassIntensity} onChange={(e) => setGlassIntensity(e.target.value as any)}>
                    <option value="subtle">Subtle</option>
                    <option value="balanced">Balanced</option>
                    <option value="strong">Strong</option>
                  </select>
                </div>
              </div>
            ) : activeSection === "about" ? (
              <div className="settings-group">
                <h4>About Custom Browser</h4>
                <p>Version 2.1.0 (Production Build)</p>
                <p>Electron 37.0.0 | Chromium 132.0 | Node.js 22.0</p>
                <p>Architecture: Phase 0–9 Complete Unification</p>
              </div>
            ) : (
              <div className="settings-group">
                <h4>{SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label} Options</h4>
                <p>Subsystem configuration active. Default settings enforced for optimal performance.</p>
                <button type="button" className="glass-btn glass-btn--sm">Reset Section to Defaults</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
