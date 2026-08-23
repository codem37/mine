import { useState } from "react";
import type { SearchResult } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly results: readonly SearchResult[];
  readonly onOpenUrl: (url: string) => void;
  readonly onToggleCompare?: (product: SearchResult) => void;
  readonly selectedCompareIds?: readonly string[];
}

export function SearchResultsList({ results, onOpenUrl, onToggleCompare, selectedCompareIds = [] }: Props): JSX.Element {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <div className="search-empty-state">
        <p>No useful results found.</p>
        <span>Try using different wording or removing filters.</span>
      </div>
    );
  }

  const handleFetcherDownload = (url: string): void => {
    if (window.mine.addDownload) {
      void window.mine.addDownload({ url });
    }
  };

  const handlePlayMedia = (url: string, title: string): void => {
    if (window.mine.playNativeMedia) {
      void window.mine.playNativeMedia({ streamId: url, url, title });
    }
  };

  return (
    <div className="search-results-list" data-testid="search-results-list">
      {results.map((res) => {
        const isHovered = hoveredId === res.id;
        const isCompared = selectedCompareIds.includes(res.id);

        if (res.type === "product") {
          return (
            <div
              key={res.id}
              className="search-result-card search-result-card--product"
              onMouseEnter={() => setHoveredId(res.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="product-card__content">
                <div className="product-card__meta">
                  <span className="product-card__seller">{res.seller || res.domain}</span>
                  <span className="product-card__price">{res.currency || "₹"}{res.price}</span>
                </div>
                <h4 className="product-card__title" onClick={() => onOpenUrl(res.url)}>{res.title}</h4>
                <p className="search-result__snippet">{res.snippet}</p>
                <div className="product-card__specs">
                  {res.specs?.cpu ? <span>CPU: {res.specs.cpu}</span> : null}
                  {res.specs?.ram ? <span>RAM: {res.specs.ram}</span> : null}
                  {res.specs?.gpu ? <span>GPU: {res.specs.gpu}</span> : null}
                </div>
              </div>
              <div className="product-card__actions">
                {onToggleCompare ? (
                  <label className="compare-checkbox">
                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => onToggleCompare(res)}
                    />
                    <span>Compare</span>
                  </label>
                ) : null}
                <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={() => onOpenUrl(res.url)}>
                  Open
                </button>
              </div>
            </div>
          );
        }

        if (res.type === "video") {
          return (
            <div
              key={res.id}
              className="search-result-card search-result-card--video"
              onMouseEnter={() => setHoveredId(res.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="video-card__content">
                <span className="search-result__domain">{res.domain}</span>
                <h4 className="search-result__title" onClick={() => onOpenUrl(res.url)}>{res.title}</h4>
                <p className="search-result__snippet">{res.snippet}</p>
                <span className="video-card__duration">Duration: {res.durationSeconds ? `${Math.floor(res.durationSeconds / 60)}m ${res.durationSeconds % 60}s` : "N/A"}</span>
              </div>
              <div className="video-card__actions">
                <button
                  type="button"
                  className="glass-btn glass-btn--sm glass-btn--primary"
                  onClick={() => handlePlayMedia(res.mediaStreamUrl || res.url, res.title)}
                >
                  ▶ Play in Native Player
                </button>
                <button type="button" className="glass-btn glass-btn--sm" onClick={() => onOpenUrl(res.url)}>
                  Open Source
                </button>
              </div>
            </div>
          );
        }

        if (res.type === "academic") {
          return (
            <div
              key={res.id}
              className="search-result-card search-result-card--academic"
              onMouseEnter={() => setHoveredId(res.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span className="academic__authors">
                {res.authors?.join(", ")} ({res.year}) — {res.journal}
              </span>
              <h4 className="search-result__title" onClick={() => onOpenUrl(res.url)}>{res.title}</h4>
              <p className="search-result__snippet">{res.snippet}</p>
              <div className="academic__footer">
                {res.doi ? <span className="academic__doi">DOI: {res.doi}</span> : null}
                <div className="academic__actions">
                  {res.pdfUrl ? (
                    <button
                      type="button"
                      className="glass-btn glass-btn--sm"
                      onClick={() => handleFetcherDownload(res.pdfUrl!)}
                    >
                      ↓ Download PDF via Fetcher
                    </button>
                  ) : null}
                  <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={() => onOpenUrl(res.url)}>
                    Open
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // Web Result default
        return (
          <div
            key={res.id}
            className="search-result-row"
            onMouseEnter={() => setHoveredId(res.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="search-result__header">
              {res.favicon ? <img src={res.favicon} alt="" className="search-result__favicon" /> : null}
              <span className="search-result__domain">{res.domain}</span>
              {res.sourceCount && res.sourceCount > 1 ? (
                <span className="search-result__sources-badge">Found across {res.sourceCount} sources</span>
              ) : null}
            </div>
            <h3 className="search-result__title" onClick={() => onOpenUrl(res.url)}>
              {res.title}
            </h3>
            <span className="search-result__url">{res.url}</span>
            <p className="search-result__snippet">{res.snippet}</p>

            {isHovered ? (
              <div className="search-result__hover-actions">
                <button type="button" className="glass-btn glass-btn--sm" onClick={() => onOpenUrl(res.url)}>
                  Open
                </button>
                <button
                  type="button"
                  className="glass-btn glass-btn--sm"
                  onClick={() => handleFetcherDownload(res.url)}
                >
                  ↓ Download via Fetcher
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
