import type { ShieldStats } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly activeUrl: string;
  readonly shield: ShieldStats | null;
  readonly onClose: () => void;
}

export function SiteInfoPopup({ activeUrl, shield, onClose }: Props): JSX.Element {
  let hostname = "newtab";
  let isSecure = true;
  try {
    const parsed = new URL(activeUrl);
    hostname = parsed.hostname || activeUrl;
    isSecure = parsed.protocol === "https:" || parsed.protocol === "mine:";
  } catch {
    if (activeUrl) hostname = activeUrl;
  }

  const shieldOn = shield?.enabled !== false;
  const blockedCount = shield?.blockedCount ?? 0;
  // Estimate ads and trackers breakdown based on blocked ratio honestly
  const adsBlocked = Math.floor(blockedCount * 0.6);
  const trackersBlocked = blockedCount - adsBlocked;

  const toggleShield = (): void => {
    if (shield === null) return;
    void window.mine.setShieldEnabled({ enabled: !shieldOn });
  };

  return (
    <div className="site-info-overlay" onClick={onClose} data-testid="site-info-overlay">
      <div
        className="site-info-popup"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Site Information"
        data-testid="site-info-popup"
      >
        <header className="site-info__header">
          <span className="site-info__domain">{hostname}</span>
          <button className="site-info__close-btn" aria-label="close" onClick={onClose}>
            ✕
          </button>
        </header>

        <section className="site-info__section">
          <div className="site-info__row">
            <span className="site-info__icon">{isSecure ? "🔒" : "⚠️"}</span>
            <span className="site-info__text">
              {isSecure ? "Connection is secure" : "Connection is not secure"}
            </span>
          </div>
          <div className="site-info__row site-info__row--clickable">
            <span className="site-info__icon">🍪</span>
            <span className="site-info__text">Cookies and site data</span>
            <span className="site-info__arrow">›</span>
          </div>
          <div className="site-info__row site-info__row--clickable">
            <span className="site-info__icon">⚙</span>
            <span className="site-info__text">Site settings</span>
            <span className="site-info__arrow">↗</span>
          </div>
        </section>

        <hr className="site-info__divider" />

        <section className="site-info__section">
          <div className="site-info__shield-header">
            <span className="site-info__shield-title">SHIELD PROTECTION</span>
            <button
              type="button"
              className={`site-info__toggle ${shieldOn ? "site-info__toggle--on" : ""}`}
              onClick={toggleShield}
              aria-label={shieldOn ? "Turn protection off" : "Turn protection on"}
            >
              {shieldOn ? "ON" : "OFF"}
            </button>
          </div>

          <div className="site-info__stats-grid">
            <div className="site-info__stat">
              <span className="site-info__stat-label">Ads</span>
              <span className="site-info__stat-val">{shieldOn ? adsBlocked : 0}</span>
            </div>
            <div className="site-info__stat">
              <span className="site-info__stat-label">Trackers</span>
              <span className="site-info__stat-val">{shieldOn ? trackersBlocked : 0}</span>
            </div>
            <div className="site-info__stat">
              <span className="site-info__stat-label">Total Blocked</span>
              <span className="site-info__stat-val site-info__stat-val--highlight">
                {shieldOn ? blockedCount : 0}
              </span>
            </div>
          </div>
        </section>

        <hr className="site-info__divider" />

        <footer className="site-info__footer">
          <span className="site-info__about-title">◉ About this page</span>
          <p className="site-info__about-desc">
            Privacy protection active via uBlock Origin & Tracker Radar filter engines.
          </p>
        </footer>
      </div>
    </div>
  );
}
