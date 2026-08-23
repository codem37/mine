import { useState, useRef } from "react";
import type { DownloadItem, DownloadSegment } from "@mine/contracts";
import type { JSX } from "react";
import { FileIcon } from "./FileIcon.js";

interface Props {
  readonly downloads: readonly DownloadItem[];
  readonly onOpenFullFetcher?: () => void;
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

function defaultSegments(percent: number): DownloadSegment[] {
  const segments: DownloadSegment[] = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const segPercent = Math.min(100, Math.max(0, percent * 1.1 - i * 10));
    segments.push({ id: i, progressPercent: Math.round(segPercent), active: segPercent > 0 && segPercent < 100 });
  }
  return segments;
}

export function DownloadBubbleItem({ item, onUndoCancel }: { readonly item: DownloadItem; readonly onUndoCancel?: (item: DownloadItem) => void }): JSX.Element {
  const [showSegments, setShowSegments] = useState(false);
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
    onUndoCancel?.(item);
  };
  const handleRetry = (): void => {
    void window.mine.retryDownload({ downloadId: item.id });
  };
  const handleOpen = (): void => {
    void window.mine.openDownloadFile({ downloadId: item.id });
  };
  const handleShowInFolder = (): void => {
    void window.mine.showDownloadInFolder({ downloadId: item.id });
  };
  const handleRemove = (): void => {
    if (window.mine.removeDownload) {
      void window.mine.removeDownload({ downloadId: item.id });
    }
  };

  return (
    <div className="download-bubble" data-testid="download-bubble">
      <div className="download-bubble__header">
        <div className="download-bubble__title-row">
          <FileIcon filename={item.filename} isTorrent={item.isTorrent} />
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

      {/* Toggle Connection Segment Visualizer */}
      {item.state === "downloading" ? (
        <button
          type="button"
          className="download-bubble__segments-toggle"
          onClick={() => setShowSegments(!showSegments)}
        >
          <span>Connections ({segments.length})</span>
          <span>{showSegments ? "▲" : "▼"}</span>
        </button>
      ) : null}

      {showSegments && item.state === "downloading" ? (
        <div className="download-bubble__segments-grid">
          {segments.map((seg) => (
            <div key={seg.id} className="download-segment" title={`Seg ${seg.id + 1}: ${seg.progressPercent}%`}>
              <div
                className={`download-segment__bar ${seg.active ? "download-segment__bar--active" : ""}`}
                style={{ width: `${seg.progressPercent}%` }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {/* Contextual Action Buttons */}
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
          <>
            <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={handleOpen}>
              Open
            </button>
            <button type="button" className="glass-btn glass-btn--sm" onClick={handleShowInFolder}>
              Folder
            </button>
          </>
        ) : null}

        {item.state === "completed" || item.state === "failed" || item.state === "cancelled" ? (
          <button type="button" className="glass-btn glass-btn--sm" onClick={handleRemove}>
            Remove
          </button>
        ) : null}

        {item.state === "downloading" || item.state === "paused" || item.state === "resuming" ? (
          <button type="button" className="glass-btn glass-btn--sm glass-btn--danger" onClick={handleCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function DownloadSystem({ downloads, onOpenFullFetcher }: Props): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const [lastCancelledItem, setLastCancelledItem] = useState<DownloadItem | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  const active = downloads.filter((d) => d.state === "downloading" || d.state === "resuming" || d.state === "paused");
  const completed = downloads.filter((d) => d.state === "completed");
  const totalSpeed = active.reduce((acc, d) => acc + d.speedBytesPerSec, 0);

  const handleCancelWithUndo = (item: DownloadItem): void => {
    setLastCancelledItem(item);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setLastCancelledItem(null);
    }, 6000) as unknown as number;
  };

  const handleUndo = (): void => {
    if (lastCancelledItem) {
      void window.mine.retryDownload({ downloadId: lastCancelledItem.id });
      setLastCancelledItem(null);
    }
  };

  if (downloads.length === 0 && !lastCancelledItem) return null;

  // Level 1 — Single Download Active
  if (active.length === 1 && !expanded) {
    return (
      <div className="download-system-floating">
        {lastCancelledItem ? (
          <div className="download-undo-toast">
            <span>Download cancelled</span>
            <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={handleUndo}>
              Undo
            </button>
          </div>
        ) : null}
        <DownloadBubbleItem item={active[0]!} onUndoCancel={handleCancelWithUndo} />
      </div>
    );
  }

  // Level 1 — Multiple Downloads Combined Summary Bubble
  if (!expanded && (active.length > 1 || downloads.length > 0)) {
    return (
      <div className="download-system-floating">
        {lastCancelledItem ? (
          <div className="download-undo-toast">
            <span>Download cancelled</span>
            <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={handleUndo}>
              Undo
            </button>
          </div>
        ) : null}

        <div className="download-summary-bubble" onClick={() => setExpanded(true)}>
          <div className="download-summary__title">
            <span className="download-summary__icon">↓</span>
            <span>{active.length > 0 ? `${active.length} active downloads` : `${downloads.length} downloads`}</span>
            {totalSpeed > 0 ? <span className="download-summary__speed">{formatSpeed(totalSpeed)}</span> : null}
          </div>
          <div className="download-summary__sub">
            {active.length} active • {completed.length} completed
          </div>
        </div>
      </div>
    );
  }

  // Level 1 — Expanded Upward Stack
  return (
    <div className="download-system-floating">
      {lastCancelledItem ? (
        <div className="download-undo-toast">
          <span>Download cancelled</span>
          <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={handleUndo}>
            Undo
          </button>
        </div>
      ) : null}

      <div className="download-expanded-stack">
        <header className="download-stack__header">
          <span>Downloads</span>
          <button type="button" className="glass-btn glass-btn--sm" onClick={() => setExpanded(false)}>✕</button>
        </header>

        <div className="download-stack__list">
          {downloads.slice(0, 5).map((item) => (
            <DownloadBubbleItem key={item.id} item={item} onUndoCancel={handleCancelWithUndo} />
          ))}
        </div>

        <footer className="download-stack__footer">
          <button
            type="button"
            className="glass-btn glass-btn--sm glass-btn--primary"
            onClick={() => {
              setExpanded(false);
              onOpenFullFetcher?.();
            }}
          >
            Open Fetcher ↗
          </button>
        </footer>
      </div>
    </div>
  );
}
