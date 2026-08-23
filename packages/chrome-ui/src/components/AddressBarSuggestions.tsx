import { useState, useEffect } from "react";
import type { SuggestionItem } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly query: string;
  readonly onSelect: (item: SuggestionItem) => void;
  readonly onClose: () => void;
}

export function AddressBarSuggestions({ query, onSelect, onClose }: Props): JSX.Element | null {
  const [suggestions, setSuggestions] = useState<readonly SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    let active = true;
    if (query.trim().length > 0 && window.mine.getSuggestions) {
      void window.mine.getSuggestions({ query }).then((res) => {
        if (active && res.ok) {
          setSuggestions(res.value.suggestions);
          setSelectedIndex(-1);
        }
      });
    } else {
      setSuggestions([]);
    }
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        if (selected) onSelect(selected);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, selectedIndex, onSelect, onClose]);

  if (suggestions.length === 0) return null;

  const historyItems = suggestions.filter((s) => s.category === "history");
  const bookmarkItems = suggestions.filter((s) => s.category === "bookmark");
  const completionItems = suggestions.filter((s) => s.category === "completion" || s.category === "contextual");

  return (
    <div className="address-suggestions-dropdown" data-testid="suggestions-dropdown">
      {historyItems.length > 0 ? (
        <div className="suggestion-section">
          <span className="suggestion-section__label">RECENT SEARCHES</span>
          {historyItems.map((item) => {
            const globalIdx = suggestions.indexOf(item);
            return (
              <button
                key={item.id}
                type="button"
                className={`suggestion-row ${selectedIndex === globalIdx ? "suggestion-row--active" : ""}`}
                onClick={() => onSelect(item)}
              >
                <span className="suggestion-row__icon">🕒</span>
                <span className="suggestion-row__text">{item.text}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {bookmarkItems.length > 0 ? (
        <div className="suggestion-section">
          <span className="suggestion-section__label">BOOKMARKS & HISTORY</span>
          {bookmarkItems.map((item) => {
            const globalIdx = suggestions.indexOf(item);
            return (
              <button
                key={item.id}
                type="button"
                className={`suggestion-row ${selectedIndex === globalIdx ? "suggestion-row--active" : ""}`}
                onClick={() => onSelect(item)}
              >
                <span className="suggestion-row__icon">★</span>
                <span className="suggestion-row__text">{item.text}</span>
                {item.url ? <span className="suggestion-row__url">{item.url}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {completionItems.length > 0 ? (
        <div className="suggestion-section">
          <span className="suggestion-section__label">SEARCH COMPLETIONS</span>
          {completionItems.map((item) => {
            const globalIdx = suggestions.indexOf(item);
            return (
              <button
                key={item.id}
                type="button"
                className={`suggestion-row ${selectedIndex === globalIdx ? "suggestion-row--active" : ""}`}
                onClick={() => onSelect(item)}
              >
                <span className="suggestion-row__icon">⌕</span>
                <span className="suggestion-row__text">{item.text}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
