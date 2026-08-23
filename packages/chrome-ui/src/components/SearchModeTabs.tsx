import type { SearchMode } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly currentMode: SearchMode;
  readonly onSelectMode: (mode: SearchMode) => void;
}

const MODES: readonly { id: SearchMode; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "⌕" },
  { id: "images", label: "Images", icon: "📷" },
  { id: "videos", label: "Videos", icon: "▶" },
  { id: "news", label: "News", icon: "📰" },
  { id: "shopping", label: "Shopping", icon: "🛒" },
  { id: "academic", label: "Academic", icon: "🎓" },
];

export function SearchModeTabs({ currentMode, onSelectMode }: Props): JSX.Element {
  return (
    <nav className="search-mode-tabs" data-testid="search-mode-tabs">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`search-mode-pill ${currentMode === m.id ? "search-mode-pill--active" : ""}`}
          onClick={() => onSelectMode(m.id)}
        >
          <span className="search-mode-pill__icon">{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </nav>
  );
}
