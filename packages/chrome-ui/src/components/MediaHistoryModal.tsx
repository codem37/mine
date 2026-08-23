import { useEffect, useState } from "react";
import type { JSX } from "react";
import type { MediaHistoryItem } from "@mine/contracts";

interface Props {
  readonly onClose: () => void;
}

export function MediaHistoryModal({ onClose }: Props): JSX.Element {
  const [history, setHistory] = useState<readonly MediaHistoryItem[]>([]);

  const reload = (): void => {
    if (window.mine.getMediaHistory) {
      void window.mine.getMediaHistory().then((res) => {
        if (res.ok && Array.isArray(res.value)) setHistory(res.value);
      });
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleClear = (): void => {
    if (window.mine.clearMediaHistory) {
      void window.mine.clearMediaHistory().then(() => reload());
    }
  };

  return (
    <div className="media-history-overlay" onClick={onClose} data-testid="media-history-modal">
      <div className="media-history-card" onClick={(e) => e.stopPropagation()}>
        <header className="media-history__header">
          <h3>Recently Played History ({history.length})</h3>
          <div className="media-history__actions">
            {history.length > 0 && (
              <button type="button" className="glass-btn glass-btn--sm glass-btn--danger" onClick={handleClear}>
                Clear History
              </button>
            )}
            <button type="button" className="glass-btn glass-btn--sm" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </header>

        <div className="media-history__list">
          {history.length === 0 ? (
            <p className="media-history__empty">No recently played media</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="media-history-item">
                <div className="media-history-item__info">
                  <span className="media-history-item__title">{item.title}</span>
                  <span className="media-history-item__domain">{item.domain} · {new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
