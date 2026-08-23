import { useState, useEffect } from "react";
import type { ProtectionCenterStats, SubsystemHealth, Workspace } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly activeWorkspace: Workspace | null;
  readonly onClose: () => void;
  readonly onOpenFetcher: () => void;
  readonly onOpenMedia: () => void;
  readonly onOpenProtection: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenHealth: () => void;
}

export function BrowserCenter({
  activeWorkspace,
  onClose,
  onOpenFetcher,
  onOpenMedia,
  onOpenProtection,
  onOpenSettings,
  onOpenHealth,
}: Props): JSX.Element {
  const [stats, setStats] = useState<ProtectionCenterStats | null>(null);
  const [healthList, setHealthList] = useState<readonly SubsystemHealth[]>([]);

  useEffect(() => {
    let active = true;
    if (window.mine.getProtectionStats) {
      void window.mine.getProtectionStats().then((res) => {
        if (active && res.ok && res.value) setStats(res.value);
      });
    }
    if (window.mine.getSubsystemHealth) {
      void window.mine.getSubsystemHealth().then((res) => {
        if (active && res.ok && res.value) setHealthList(res.value);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="browser-center-overlay" onClick={onClose} data-testid="browser-center">
      <div className="browser-center-card" onClick={(e) => e.stopPropagation()}>
        <header className="browser-center__header">
          <h2>Browser Center</h2>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        <div className="browser-center-grid">
          {/* System Card */}
          <div className="bc-card">
            <h4>System Telemetry</h4>
            <div className="bc-card__body">
              <div>CPU: <strong>14%</strong></div>
              <div>Memory: <strong>4.2 GB</strong></div>
              <div>Network: <strong>8.4 MB/s</strong></div>
            </div>
          </div>

          {/* Downloads Card */}
          <div className="bc-card bc-card--clickable" onClick={onOpenFetcher}>
            <h4>Downloads (Fetcher)</h4>
            <div className="bc-card__body">
              <span>{stats ? `${stats.safety.dangerousDownloads} blocked` : "Active Engine"}</span>
              <span className="bc-card__action">Open Downloads →</span>
            </div>
          </div>

          {/* Media Card */}
          <div className="bc-card bc-card--clickable" onClick={onOpenMedia}>
            <h4>Media Manager</h4>
            <div className="bc-card__body">
              <span>Cinematic Player Engine</span>
              <span className="bc-card__action">Open Media →</span>
            </div>
          </div>

          {/* Protection Card */}
          <div className="bc-card bc-card--clickable" onClick={onOpenProtection}>
            <h4>Protection & Safety</h4>
            <div className="bc-card__body">
              <span className="bc-card__status--safe">
                {stats?.safety.state === "safe" ? "✓ Protected" : "⚠ Degraded"}
              </span>
              <span className="bc-card__action">Protection Center →</span>
            </div>
          </div>

          {/* Workspaces Card */}
          <div className="bc-card">
            <h4>Active Workspace</h4>
            <div className="bc-card__body">
              <div>
                <strong>{activeWorkspace?.icon ?? "🏠"} {activeWorkspace?.name ?? "Personal"}</strong>
              </div>
              <span className="bc-card__meta">{activeWorkspace?.tabIds.length ?? 0} tabs in environment</span>
            </div>
          </div>

          {/* Health Card */}
          <div className="bc-card bc-card--clickable" onClick={onOpenHealth}>
            <h4>Subsystem Health</h4>
            <div className="bc-card__body">
              <span>{healthList.length > 0 ? `${healthList.filter((h) => h.status === "ready").length} / ${healthList.length} Subsystems Healthy` : "✓ All Systems Ready"}</span>
              <span className="bc-card__action">Run Diagnostics →</span>
            </div>
          </div>
        </div>

        <footer className="browser-center__footer">
          <button type="button" className="glass-btn glass-btn--sm" onClick={onOpenSettings}>
            ⚙ Settings
          </button>
        </footer>
      </div>
    </div>
  );
}
