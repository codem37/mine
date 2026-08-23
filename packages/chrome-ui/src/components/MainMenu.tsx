import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
  readonly onOpenDownloads?: () => void;
}

interface MenuItem {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly shortcut?: string;
  readonly action?: () => void;
}

export function MainMenu({ onClose, onOpenDownloads }: Props): JSX.Element {
  const handleAction = (item: MenuItem): void => {
    if (item.id === "new-tab") {
      void window.mine.newTab();
    } else if (item.id === "new-window") {
      void window.mine.newTab({ url: "mine://newtab/" });
    } else if (item.id === "downloads") {
      onOpenDownloads?.();
    } else if (item.id === "exit") {
      void window.mine.closeWindow();
    }
    onClose();
  };

  const items: readonly MenuItem[] = [
    { id: "new-tab", icon: "+", label: "New Tab", shortcut: "Ctrl+T" },
    { id: "new-window", icon: "□", label: "New Window", shortcut: "Ctrl+N" },
    { id: "private-window", icon: "🕶", label: "Private Window", shortcut: "Ctrl+Shift+N" },
    { id: "history", icon: "◷", label: "History", shortcut: "Ctrl+H" },
    { id: "downloads", icon: "↓", label: "Downloads", shortcut: "Ctrl+J" },
    { id: "bookmarks", icon: "★", label: "Bookmarks", shortcut: "Ctrl+D" },
    { id: "zoom", icon: "🔍", label: "Zoom", shortcut: "100%" },
    { id: "find", icon: "🔎", label: "Find on Page", shortcut: "Ctrl+F" },
    { id: "print", icon: "🖨", label: "Print", shortcut: "Ctrl+P" },
    { id: "settings", icon: "⚙", label: "Settings" },
    { id: "help", icon: "?", label: "Help" },
    { id: "exit", icon: "✕", label: "Exit Browser" },
  ];

  return (
    <div className="menu-overlay" onClick={onClose} data-testid="menu-overlay">
      <div
        className="menu-pill-stack"
        onClick={(e) => e.stopPropagation()}
        role="menu"
        aria-label="Main Menu"
        data-testid="main-menu"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            className="menu-pill"
            role="menuitem"
            style={{ animationDelay: `${index * 20}ms` }}
            onClick={() => handleAction(item)}
          >
            <span className="menu-pill__icon">{item.icon}</span>
            <span className="menu-pill__label">{item.label}</span>
            {item.shortcut ? (
              <span className="menu-pill__shortcut">{item.shortcut}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
