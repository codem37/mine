import { useEffect, useState } from "react";
import type { JSX } from "react";
import type { MediaQueueItem, MediaSource } from "@mine/contracts";

interface Props {
  readonly onClose: () => void;
  readonly onPlayItem: (source: MediaSource) => void;
}

export function MediaQueueModal({ onClose, onPlayItem }: Props): JSX.Element {
  const [queue, setQueue] = useState<readonly MediaQueueItem[]>([]);

  const reload = (): void => {
    if (window.mine.getMediaQueue) {
      void window.mine.getMediaQueue().then((res) => {
        if (res.ok && Array.isArray(res.value)) setQueue(res.value);
      });
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleRemove = (id: string): void => {
    if (window.mine.removeFromMediaQueue) {
      void window.mine.removeFromMediaQueue(id).then(() => reload());
    }
  };

  const handleClear = (): void => {
    if (window.mine.clearMediaQueue) {
      void window.mine.clearMediaQueue().then(() => reload());
    }
  };

  return (
    <div className="media-queue-overlay" onClick={onClose} data-testid="media-queue-modal">
      <div className="media-queue-card" onClick={(e) => e.stopPropagation()}>
        <header className="media-queue__header">
          <h3>Media Queue ({queue.length})</h3>
          <div className="media-queue__actions">
            {queue.length > 0 && (
              <button type="button" className="glass-btn glass-btn--sm glass-btn--danger" onClick={handleClear}>
                Clear
              </button>
            )}
            <button type="button" className="glass-btn glass-btn--sm" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </header>

        <div className="media-queue__list">
          {queue.length === 0 ? (
            <p className="media-queue__empty">No media in queue</p>
          ) : (
            queue.map((item, idx) => (
              <div key={item.id} className="media-queue-item">
                <span className="media-queue-item__idx">{idx + 1}</span>
                <span className="media-queue-item__title">{item.source.title || "Media Stream"}</span>
                <button
                  type="button"
                  className="glass-btn glass-btn--sm"
                  onClick={() => {
                    onPlayItem(item.source);
                    onClose();
                  }}
                >
                  ▶ Play
                </button>
                <button
                  type="button"
                  className="glass-btn glass-btn--sm glass-btn--danger"
                  onClick={() => handleRemove(item.id)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
