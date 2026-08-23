import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
  readonly onOpenDownloads?: () => void;
  readonly onOpenMedia?: () => void;
  readonly onOpenProtection?: () => void;
  readonly onOpenBrowserCenter?: () => void;
  readonly onOpenSettings?: () => void;
  readonly onOpenDiagnostics?: () => void;
}

interface MenuItem {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly shortcut?: string;
  readonly action?: () => void;
}

export function MainMenu({
  onClose,
  onOpenDownloads,
  onOpenMedia,
  onOpenProtection,
  onOpenBrowserCenter,
  onOpenSettings,
  onOpenDiagnostics,
}: Props): JSX.Element {
  const handleAction = (item: MenuItem): void => {
    if (item.id === "new-tab") {
      void window.mine.newTab();
    } else if (item.id === "new-window") {
      void window.mine.newTab({ url: "mine://newtab/" });
    } else if (item.id === "downloads") {
      onOpenDownloads?.();
    } else if (item.id === "media") {
      onOpenMedia?.();
    } else if (item.id === "protection") {
      onOpenProtection?.();
    } else if (item.id === "browser-center") {
      onOpenBrowserCenter?.();
    } else if (item.id === "settings") {
      onOpenSettings?.();
    } else if (item.id === "diagnostics") {
      onOpenDiagnostics?.();
    } else if (item.id === "exit") {
      void window.mine.closeWindow();
    }
    onClose();
  };

  const items: readonly MenuItem[] = [
    { id: "new-tab", icon: "➕", label: "New Tab", shortcut: "Ctrl+T" },
    { id: "new-window", icon: "🗔", label: "New Window", shortcut: "Ctrl+N" },
    { id: "browser-center", icon: "❖", label: "Browser Center", shortcut: "Ctrl+K" },
    { id: "downloads", icon: "📥", label: "Downloads (Fetcher)", shortcut: "Ctrl+J" },
    { id: "media", icon: "🎬", label: "Media Player Engine" },
    { id: "protection", icon: "🛡️", label: "Protection & Safety" },
    { id: "settings", icon: "⚙️", label: "Settings & Options" },
    { id: "diagnostics", icon: "🩺", label: "Subsystem Diagnostics" },
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
