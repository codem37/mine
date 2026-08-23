import { useState } from "react";
import type { MediaSource } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly sources: readonly MediaSource[];
  readonly onClose: () => void;
  readonly onOpenPlayer: (source: MediaSource) => void;
}

export function MediaActionBubble({ sources, onClose, onOpenPlayer }: Props): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const activeSource = sources[selectedIndex] ?? sources[0] ?? null;

  const handleDownload = (quality?: string): void => {
    if (activeSource && window.mine.downloadMediaSource) {
      void window.mine.downloadMediaSource({
        sourceId: activeSource.id,
        url: activeSource.url,
        title: activeSource.title || "media-download",
        quality: quality || "Auto",
        format: activeSource.format,
      });
      onClose();
    }
  };

  return (
    <div className="media-bubble-overlay" onClick={onClose} data-testid="media-bubble-overlay">
      <div className="media-bubble-card" onClick={(e) => e.stopPropagation()} data-testid="media-bubble-card">
        <header className="media-bubble__header">
          <span className="media-bubble__title">Media Options</span>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        {/* Source Switcher if multiple media sources detected */}
        {sources.length > 1 ? (
          <div className="media-bubble__selector">
            {sources.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`media-selector-pill ${selectedIndex === i ? "media-selector-pill--active" : ""}`}
                onClick={() => setSelectedIndex(i)}
              >
                {i + 1}. {s.title || s.format.toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}

        {/* Media Details Banner */}
        {activeSource ? (
          <div className="media-bubble__info-banner">
            <span className="media-bubble__name">{activeSource.title || activeSource.url}</span>
            <span className="media-bubble__badge">{activeSource.format.toUpperCase()}</span>
          </div>
        ) : null}

        {/* DRM Warning Notice */}
        {activeSource?.isDrmProtected ? (
          <div className="media-bubble__drm-notice">
            <span>🔒 DRM Protected Media</span>
            <p>This media uses Widevine/FairPlay DRM encryption and must remain within the webpage player.</p>
          </div>
        ) : null}

        {/* Independent Capsule Pills */}
        <div className="media-bubble__actions">
          {activeSource && !activeSource.isDrmProtected ? (
            <button
              type="button"
              className="menu-pill"
              onClick={() => {
                onOpenPlayer(activeSource);
                onClose();
              }}
            >
              <span className="menu-pill__icon">▶</span>
              <span className="menu-pill__label">Play in Native Player</span>
            </button>
          ) : null}

          {activeSource && !activeSource.isDrmProtected ? (
            <div className="media-bubble__download-group">
              <button
                type="button"
                className="menu-pill"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
              >
                <span className="menu-pill__icon">↓</span>
                <span className="menu-pill__label">Download via Fetcher</span>
                <span>{showQualityMenu ? "▲" : "▼"}</span>
              </button>

              {showQualityMenu ? (
                <div className="media-bubble__quality-list">
                  {activeSource.qualities.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      className="media-quality-btn"
                      onClick={() => handleDownload(q.label)}
                    >
                      {q.label} {q.height ? `(${q.width}x${q.height})` : ""}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
