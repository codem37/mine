import { useEffect, useState, useCallback } from "react";
import type { JSX } from "react";
import type { SiteShieldSettings, ShieldStats } from "@mine/contracts";

interface Props {
  readonly domain: string;
  readonly onClose: () => void;
  readonly onOpenFilterLists: () => void;
}

function ShieldIcon({ active }: { active: boolean }): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 1.5L2 5v5c0 4.5 3.5 8 8 9.5C15.5 18 19 14.5 19 10V5L10 1.5z"
        fill={active ? "#00e5ff" : "rgba(255,255,255,0.3)"}
        stroke={active ? "#00b8d4" : "rgba(255,255,255,0.25)"}
        strokeWidth="1.5"
      />
      {active && (
        <path d="M6.5 10.5l2.5 2.5 4.5-5" stroke="#001a2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }): JSX.Element {
  return (
    <label className="shield-toggle-row">
      <span className="shield-toggle-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`shield-toggle-switch ${checked ? "shield-toggle-switch--on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="shield-toggle-thumb" />
      </button>
    </label>
  );
}

const DEFAULT_SITE_SETTINGS: SiteShieldSettings = {
  domain: "",
  adsBlocked: true,
  trackersBlocked: true,
  cosmeticsEnabled: true,
  allowlisted: false,
};

export function ShieldPanel({ domain, onClose, onOpenFilterLists }: Props): JSX.Element {
  const [settings, setSettings] = useState<SiteShieldSettings>({
    ...DEFAULT_SITE_SETTINGS,
    domain,
  });
  const [stats, setStats] = useState<Pick<ShieldStats, "adsBlocked" | "trackersBlocked">>({
    adsBlocked: 0,
    trackersBlocked: 0,
  });
  const [saving, setSaving] = useState(false);

  // Load site settings + global stats on mount
  useEffect(() => {
    let active = true;
    if (window.mine.getSiteShieldSettings) {
      void window.mine.getSiteShieldSettings(domain).then((res) => {
        if (active && res.ok && res.value) setSettings(res.value as SiteShieldSettings);
      });
    }
    if (window.mine.getShieldStats) {
      void window.mine.getShieldStats().then((res) => {
        if (active && res.ok && res.value) {
          const s = res.value as ShieldStats;
          setStats({ adsBlocked: s.adsBlocked ?? 0, trackersBlocked: s.trackersBlocked ?? 0 });
        }
      });
    }
    return () => { active = false; };
  }, [domain]);

  const updateSetting = useCallback(
    (partial: Partial<Omit<SiteShieldSettings, "domain">>) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      setSaving(true);
      void window.mine.setSiteShieldSettings({ domain, ...partial }).finally(() => setSaving(false));
    },
    [settings, domain],
  );

  const shieldActive = !settings.allowlisted;

  return (
    <div className="shield-panel-overlay" onClick={onClose} data-testid="shield-panel">
      <div className="shield-panel-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="shield-panel__header">
          <div className="shield-panel__title-row">
            <ShieldIcon active={shieldActive} />
            <span className="shield-panel__title">Shield</span>
            <Toggle
              checked={!settings.allowlisted}
              onChange={(v) => updateSetting({ allowlisted: !v })}
              label={shieldActive ? "On" : "Off"}
            />
          </div>
          <div className="shield-panel__domain">{domain}</div>
          <button type="button" className="shield-panel__close glass-btn glass-btn--sm" onClick={onClose} aria-label="Close Shield Panel">✕</button>
        </header>

        {/* Stats */}
        <div className="shield-panel__stats">
          <span className="shield-stat">
            <strong>{stats.adsBlocked}</strong> ads blocked
          </span>
          <span className="shield-stat-sep">·</span>
          <span className="shield-stat">
            <strong>{stats.trackersBlocked}</strong> trackers blocked
          </span>
          {saving && <span className="shield-stat-saving">saving…</span>}
        </div>

        {/* Per-site toggles (disabled when allowlisted) */}
        <div className={`shield-panel__toggles ${!shieldActive ? "shield-panel__toggles--disabled" : ""}`}>
          <Toggle
            checked={settings.adsBlocked}
            onChange={(v) => updateSetting({ adsBlocked: v })}
            label="Block Ads"
          />
          <Toggle
            checked={settings.trackersBlocked}
            onChange={(v) => updateSetting({ trackersBlocked: v })}
            label="Block Trackers"
          />
          <Toggle
            checked={settings.cosmeticsEnabled}
            onChange={(v) => updateSetting({ cosmeticsEnabled: v })}
            label="Cosmetic Filtering"
          />
        </div>

        {/* Footer */}
        <footer className="shield-panel__footer">
          <button
            type="button"
            className="glass-btn--pill"
            onClick={onOpenFilterLists}
          >
            📜 Manage Filter Lists
          </button>
        </footer>
      </div>
    </div>
  );
}
