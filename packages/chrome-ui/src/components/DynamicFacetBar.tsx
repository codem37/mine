import { useState } from "react";
import type { DynamicFacet } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly facets: readonly DynamicFacet[];
  readonly appliedFacets: Record<string, string | readonly string[] | readonly [number, number]>;
  readonly onToggleFacet: (facetId: string, value: string) => void;
  readonly onClearAll: () => void;
}

export function DynamicFacetBar({ facets, appliedFacets, onToggleFacet, onClearAll }: Props): JSX.Element | null {
  const [activePopover, setActivePopover] = useState<string | null>(null);

  if (facets.length === 0) return null;

  const hasApplied = Object.keys(appliedFacets).length > 0;

  return (
    <div className="dynamic-facet-bar" data-testid="dynamic-facet-bar">
      <div className="dynamic-facet-bar__list">
        {facets.map((facet) => {
          const isOpen = activePopover === facet.id;
          const appliedVal = appliedFacets[facet.id];
          const isApplied = Boolean(appliedVal);

          return (
            <div key={facet.id} className="facet-popover-wrap">
              <button
                type="button"
                className={`facet-pill ${isApplied ? "facet-pill--active" : ""}`}
                onClick={() => setActivePopover(isOpen ? null : facet.id)}
              >
                <span>{facet.label}</span>
                <span className="facet-pill__arrow">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen ? (
                <div className="facet-popover">
                  {facet.values.map((v) => {
                    const isChecked = Array.isArray(appliedVal)
                      ? (appliedVal as string[]).includes(v.value)
                      : appliedVal === v.value;

                    return (
                      <label key={v.value} className="facet-option-row">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleFacet(facet.id, v.value)}
                        />
                        <span className="facet-option-row__label">{v.label}</span>
                        <span className="facet-option-row__count">({v.count})</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}

        {hasApplied ? (
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClearAll}>
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
