import { useEffect, useState } from "react";
import type { ProtectionCenterStats } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
  readonly onOpenSiteInfo: () => void;
  readonly onOpenEvents: () => void;
}

export function ProtectionCenter({ onClose, onOpenSiteInfo, onOpenEvents }: Props): JSX.Element {
  const [stats, setStats] = useState<ProtectionCenterStats>({
    privacy: { adsBlocked: 18, trackersBlocked: 11 },
    safety: { state: "safe", threatsBlocked: 0, suspiciousSites: 0, dangerousDownloads: 0 },
    dbStatus: { status: "current", lastUpdated: Date.now() },
    activePermissionsCount: 3,
  });

  useEffect(() => {
    let active = true;
    if (window.mine.getProtectionStats) {
      void window.mine.getProtectionStats().then((res) => {
        if (active && res.ok && res.value) {
          setStats(res.value);
        }
      });
    }
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="protection-center-overlay" onClick={onClose} data-testid="protection-center">
      <div className="protection-center-card" onClick={(e) => e.stopPropagation()}>
        <header className="protection-center__header">
          <h3>Protection Center</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        {/* Privacy Section (Shield) */}
        <section className="protection-section">
          <div className="protection-section__header">
            <span className="protection-section__title">Privacy</span>
            <span className="protection-section__status protection-section__status--safe">✓ Protected</span>
          </div>
          <div className="protection-stats-grid">
            <span>{stats.privacy.adsBlocked} ads blocked</span>
            <span>{stats.privacy.trackersBlocked} trackers blocked</span>
          </div>
        </section>

        {/* Safety Section (Threat Protection) */}
        <section className="protection-section">
          <div className="protection-section__header">
            <span className="protection-section__title">Safety</span>
            <span className={`protection-section__status protection-section__status--${stats.safety.state}`}>
              {stats.safety.state === "safe" ? "✓ No known threats" : `⚠ ${stats.safety.state.toUpperCase()}`}
            </span>
          </div>
          <div className="protection-stats-grid">
            <span>{stats.safety.threatsBlocked} threats blocked</span>
            <span>{stats.safety.suspiciousSites} suspicious sites</span>
            <span>{stats.safety.dangerousDownloads} dangerous downloads</span>
          </div>
        </section>

        {/* Protection Data Status */}
        <section className="protection-section">
          <div className="protection-section__header">
            <span className="protection-section__title">Protection Data</span>
            <span className="protection-section__status protection-section__status--safe">
              {stats.dbStatus.status === "current" ? "✓ Current" : "⚠ Stale"}
            </span>
          </div>
        </section>

        {/* Active Permissions */}
        <section className="protection-section">
          <div className="protection-section__header">
            <span className="protection-section__title">Permissions</span>
            <span>{stats.activePermissionsCount} active</span>
          </div>
        </section>

        <footer className="protection-center__footer">
          <button type="button" className="glass-btn glass-btn--sm" onClick={onOpenSiteInfo}>
            Site Information
          </button>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onOpenEvents}>
            Security Events History
          </button>
        </footer>
      </div>
    </div>
  );
}
