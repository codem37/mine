import { useState, useEffect } from "react";
import type { DynamicFacet, SearchMode, SearchResponse, SearchResult } from "@mine/contracts";
import type { JSX } from "react";
import { SearchModeTabs } from "./SearchModeTabs.js";
import { DynamicFacetBar } from "./DynamicFacetBar.js";
import { SearchResultsList } from "./SearchResultsList.js";
import { ProductComparisonModal } from "./ProductComparisonModal.js";
import { SearchDiagnosticsModal } from "./SearchDiagnosticsModal.js";

interface Props {
  readonly initialQuery?: string;
  readonly onClose?: () => void;
}

export function SearchPage({ initialQuery = "", onClose }: Props): JSX.Element {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>("all");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [appliedFacets, setAppliedFacets] = useState<Record<string, string | readonly string[] | readonly [number, number]>>({});
  const [selectedCompare, setSelectedCompare] = useState<readonly SearchResult[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [loading, setLoading] = useState(false);

  const executeSearch = (q: string, targetMode: SearchMode = mode): void => {
    if (!q.trim()) return;
    setLoading(true);
    if (window.mine.search) {
      void window.mine.search({ query: q, mode: targetMode, appliedFacets }).then((res) => {
        setLoading(false);
        if (res.ok) setResponse(res.value);
      });
    }
  };

  useEffect(() => {
    if (initialQuery.trim()) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSelectMode = (newMode: SearchMode): void => {
    setMode(newMode);
    executeSearch(query, newMode);
  };

  const handleToggleFacet = (facetId: string, value: string): void => {
    const current = appliedFacets[facetId];
    let updatedVal: string[] = [];
    if (Array.isArray(current)) {
      updatedVal = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    } else if (current === value) {
      updatedVal = [];
    } else {
      updatedVal = [value];
    }

    const nextApplied = { ...appliedFacets };
    if (updatedVal.length === 0) delete nextApplied[facetId];
    else nextApplied[facetId] = updatedVal;

    setAppliedFacets(nextApplied);
    if (window.mine.search) {
      void window.mine.search({ query, mode, appliedFacets: nextApplied }).then((res) => {
        if (res.ok) setResponse(res.value);
      });
    }
  };

  const handleToggleCompare = (product: SearchResult): void => {
    if (selectedCompare.some((p) => p.id === product.id)) {
      setSelectedCompare((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setSelectedCompare((prev) => [...prev, product]);
    }
  };

  return (
    <div className="search-page" data-testid="search-page">
      <header className="search-page__header">
        <div className="search-page__input-wrap">
          <span className="search-page__icon">⌕</span>
          <input
            value={query}
            className="search-page__input"
            placeholder="Search the web"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") executeSearch(query);
            }}
          />
          {onClose ? (
            <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>
              ✕
            </button>
          ) : null}
        </div>

        <SearchModeTabs currentMode={mode} onSelectMode={handleSelectMode} />

        {response?.facets ? (
          <DynamicFacetBar
            facets={response.facets}
            appliedFacets={appliedFacets}
            onToggleFacet={handleToggleFacet}
            onClearAll={() => {
              setAppliedFacets({});
              executeSearch(query);
            }}
          />
        ) : null}
      </header>

      <main className="search-page__content">
        {response?.typoCorrection ? (
          <div className="search-typo-banner">
            Showing results for <strong>{response.typoCorrection}</strong>
          </div>
        ) : null}

        {response ? (
          <div className="search-page__meta-bar">
            <span>
              {response.totalResults} results ({response.timeMs} ms)
            </span>
            <div className="search-page__header-actions">
              {selectedCompare.length > 0 ? (
                <button
                  type="button"
                  className="glass-btn glass-btn--sm glass-btn--primary"
                  onClick={() => setShowCompareModal(true)}
                >
                  Compare ({selectedCompare.length})
                </button>
              ) : null}
              {response.diagnostics ? (
                <button
                  type="button"
                  className="glass-btn glass-btn--sm"
                  onClick={() => setShowDiagnostics(true)}
                >
                  ⚙ Search Diagnostics
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="search-loading">Searching the web...</div>
        ) : response ? (
          <SearchResultsList
            results={response.results}
            onOpenUrl={(url) => {
              if (window.location) {
                window.location.href = url;
              }
            }}
            onToggleCompare={handleToggleCompare}
            selectedCompareIds={selectedCompare.map((p) => p.id)}
          />
        ) : null}
      </main>

      {showCompareModal ? (
        <ProductComparisonModal
          products={selectedCompare}
          onClose={() => setShowCompareModal(false)}
        />
      ) : null}

      {showDiagnostics && response?.diagnostics ? (
        <SearchDiagnosticsModal
          diagnostics={response.diagnostics}
          onClose={() => setShowDiagnostics(false)}
        />
      ) : null}
    </div>
  );
}
