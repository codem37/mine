import { useState } from "react";
import type { DownloadItem, DownloadSegment } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly downloads: readonly DownloadItem[];
  readonly onCloseList?: () => void;
  readonly showFullList?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return "0 B/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatEta(seconds: number | null): string {
  if (seconds === null || seconds <= 0 || !Number.isFinite(seconds)) return "estimating...";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s remaining`;
  return `${s}s remaining`;
}

// Default mock segments generator if segments empty
function defaultSegments(percent: number): DownloadSegment[] {
  const segments: DownloadSegment[] = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const segPercent = Math.min(100, Math.max(0, percent * 1.1 - i * 10));
    segments.push({ id: i, progressPercent: Math.round(segPercent), active: segPercent > 0 && segPercent < 100 });
  }
  return segments;
}

export function DownloadBubble({ item }: { readonly item: DownloadItem }): JSX.Element {
  const [expandedSegments, setExpandedSegments] = useState(true);
  const percent = item.totalBytes > 0 
    ? Math.round((item.downloadedBytes / item.totalBytes) * 100) 
    : 0;

  const segments = item.segments.length > 0 ? item.segments : defaultSegments(percent);

  const handlePause = (): void => {
    void window.mine.pauseDownload({ downloadId: item.id });
  };
  const handleResume = (): void => {
    void window.mine.resumeDownload({ downloadId: item.id });
  };
  const handleCancel = (): void => {
    void window.mine.cancelDownload({ downloadId: item.id });
  };
  const handleRetry = (): void => {
    void window.mine.retryDownload({ downloadId: item.id });
  };
  const handleOpen = (): void => {
    void window.mine.openDownloadFile({ downloadId: item.id });
  };

  return (
    <div className="download-bubble" data-testid="download-bubble">
      <div className="download-bubble__header">
        <div className="download-bubble__title-row">
          <span className="download-bubble__icon">↓</span>
          <span className="download-bubble__name" title={item.filename}>{item.filename}</span>
          <span className="download-bubble__percent">{percent}%</span>
        </div>
        <div className="download-bubble__sub-row">
          <span>{formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}</span>
          {item.state === "downloading" ? (
            <span>{formatSpeed(item.speedBytesPerSec)} • {formatEta(item.etaSeconds)}</span>
          ) : (
            <span className={`download-bubble__status download-bubble__status--${item.state}`}>{item.state}</span>
          )}
        </div>
      </div>

      <div className="download-bubble__progress-track">
        <div className="download-bubble__progress-fill" style={{ width: `${percent}%` }} />
      </div>

      {/* Segmented 8-Thread Visualization */}
      <div className="download-bubble__segments-container">
        <button
          type="button"
          className="download-bubble__segments-toggle"
          onClick={() => setExpandedSegments(!expandedSegments)}
        >
          <span>Multi-thread connection status (8 segments)</span>
          <span>{expandedSegments ? "▲" : "▼"}</span>
        </button>

        {expandedSegments ? (
          <div className="download-bubble__segments-grid">
            {segments.map((seg) => (
              <div key={seg.id} className="download-segment">
                <div
                  className={`download-segment__bar ${seg.active ? "download-segment__bar--active" : ""}`}
                  style={{ width: `${seg.progressPercent}%` }}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="download-bubble__actions">
        {item.state === "downloading" || item.state === "resuming" ? (
          <button type="button" className="glass-btn glass-btn--sm" onClick={handlePause}>
            Pause
          </button>
        ) : null}

        {item.state === "paused" ? (
          <button type="button" className="glass-btn glass-btn--sm" onClick={handleResume}>
            Resume
          </button>
        ) : null}

        {item.state === "failed" || item.state === "cancelled" ? (
          <button type="button" className="glass-btn glass-btn--sm" onClick={handleRetry}>
            Retry
          </button>
        ) : null}

        {item.state === "completed" ? (
          <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={handleOpen}>
            Open File
          </button>
        ) : null}

        {item.state !== "completed" ? (
          <button type="button" className="glass-btn glass-btn--sm glass-btn--danger" onClick={handleCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function DownloadSystem({ downloads, onCloseList, showFullList = false }: Props): JSX.Element | null {
  const activeDownloads = downloads.filter((d) => d.state === "downloading" || d.state === "resuming" || d.state === "paused");
  const latestActive = activeDownloads[0] ?? downloads[0] ?? null;

  if (showFullList) {
    return (
      <div className="downloads-drawer-overlay" onClick={onCloseList} data-testid="downloads-overlay">
        <div className="downloads-drawer" onClick={(e) => e.stopPropagation()}>
          <header className="downloads-drawer__header">
            <h3>Downloads</h3>
            <button type="button" className="glass-btn" onClick={onCloseList}>✕</button>
          </header>

          <div className="downloads-drawer__list">
            {downloads.length === 0 ? (
              <p className="downloads-drawer__empty">No downloads yet</p>
            ) : (
              downloads.map((item) => (
                <div key={item.id} className="downloads-drawer__item">
                  <DownloadBubble item={item} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (latestActive === null) return null;

  return (
    <div className="download-system-floating">
      <DownloadBubble item={latestActive} />
    </div>
  );
}
