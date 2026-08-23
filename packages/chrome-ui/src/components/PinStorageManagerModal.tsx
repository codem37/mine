import { useState, useEffect } from "react";
import type { IPFSStorageStats } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
}

export function PinStorageManagerModal({ onClose }: Props): JSX.Element {
  const [stats, setStats] = useState<IPFSStorageStats>({
    pinnedCount: 1,
    cacheSizeBytes: 2400000,
    pinnedSizeBytes: 2400000,
    availableBytes: 50 * 1024 * 1024 * 1024,
  });

  const loadStats = (): void => {
    if (window.mine.getIpfsStorageStats) {
      void window.mine.getIpfsStorageStats().then((res) => {
        if (res.ok && res.value) {
          setStats(res.value);
        }
      });
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = (): void => {
    if (window.mine.clearIpfsCache) {
      void window.mine.clearIpfsCache().then(() => loadStats());
    }
  };

  return (
    <div className="pin-storage-overlay" onClick={onClose} data-testid="pin-storage-modal">
      <div className="pin-storage-card" onClick={(e) => e.stopPropagation()}>
        <header className="pin-storage__header">
          <h3>IPFS Storage & Pin Manager</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        <div className="pin-storage__grid">
          <div className="pin-storage-stat">
            <span className="pin-storage-stat__label">Pinned Items</span>
            <span className="pin-storage-stat__val">{stats.pinnedCount} items</span>
          </div>

          <div className="pin-storage-stat">
            <span className="pin-storage-stat__label">Local Cache</span>
            <span className="pin-storage-stat__val">{(stats.cacheSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>

          <div className="pin-storage-stat">
            <span className="pin-storage-stat__label">Available Space</span>
            <span className="pin-storage-stat__val">{(stats.availableBytes / (1024 * 1024 * 1024)).toFixed(0)} GB</span>
          </div>
        </div>

        <footer className="pin-storage__footer">
          <button type="button" className="glass-btn glass-btn--sm" onClick={handleClearCache}>
            Clear Cache
          </button>
          <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
