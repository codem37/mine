import type { SearchDiagnostics } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly diagnostics: SearchDiagnostics;
  readonly onClose: () => void;
}

export function SearchDiagnosticsModal({ diagnostics, onClose }: Props): JSX.Element {
  return (
    <div className="diagnostics-modal-overlay" onClick={onClose} data-testid="search-diagnostics-modal">
      <div className="diagnostics-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="diagnostics-modal__header">
          <h3>Search Diagnostics</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        <div className="diagnostics-grid">
          <div className="diag-item">
            <span className="diag-label">Sources Queried:</span>
            <span className="diag-val">{diagnostics.sourcesQueried}</span>
          </div>
          <div className="diag-item">
            <span className="diag-label">Sources Available:</span>
            <span className="diag-val">{diagnostics.sourcesAvailable}</span>
          </div>
          <div className="diag-item">
            <span className="diag-label">Query Variants:</span>
            <span className="diag-val">{diagnostics.queryVariants}</span>
          </div>
          <div className="diag-item">
            <span className="diag-label">Results Merged (RRF):</span>
            <span className="diag-val">{diagnostics.resultsMerged}</span>
          </div>
          <div className="diag-item">
            <span className="diag-label">Results Reranked:</span>
            <span className="diag-val">{diagnostics.resultsReranked}</span>
          </div>
          <div className="diag-item">
            <span className="diag-label">Cache Status:</span>
            <span className={`diag-val ${diagnostics.cacheStatus === "HIT" ? "diag-val--hit" : ""}`}>
              {diagnostics.cacheStatus}
            </span>
          </div>
          <div className="diag-item">
            <span className="diag-label">Latency:</span>
            <span className="diag-val">{diagnostics.latencyMs} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
