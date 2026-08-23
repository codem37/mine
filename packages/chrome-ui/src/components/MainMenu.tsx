import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
  readonly onOpenDownloads?: () => void;
  readonly onOpenMedia?: () => void;
  readonly onOpenProtection?: () => void;
  readonly onOpenBrowserCenter?: () => void;
  readonly onOpenSettings?: () => void;
  readonly onOpenDiagnostics?: () => void;
  readonly onOpenCommandCenter?: () => void;
  readonly onOpenShieldPanel?: () => void;
  readonly onOpenEvents?: () => void;
  readonly onOpenMediaQueue?: () => void;
  readonly onOpenMediaHistory?: () => void;
}

interface MenuItem {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly shortcut?: string;
}

export function MainMenu({
  onClose,
  onOpenDownloads,
  onOpenMedia,
  onOpenProtection,
  onOpenBrowserCenter,
  onOpenSettings,
  onOpenDiagnostics,
  onOpenCommandCenter,
  onOpenShieldPanel,
  onOpenEvents,
  onOpenMediaQueue,
  onOpenMediaHistory,
}: Props): JSX.Element {
  const handleAction = (id: string): void => {
    if (id === "new-tab") {
      void window.mine.newTab();
    } else if (id === "new-window") {
      void window.mine.newTab({ url: "mine://newtab/" });
    } else if (id === "private-window") {
      void window.mine.newTab({ url: "mine://newtab/", partition: "incognito" });
    } else if (id === "command-center") {
      onOpenCommandCenter?.();
    } else if (id === "browser-center") {
      onOpenBrowserCenter?.();
    } else if (id === "downloads") {
      onOpenDownloads?.();
    } else if (id === "media") {
      onOpenMedia?.();
    } else if (id === "media-queue") {
      onOpenMediaQueue?.();
    } else if (id === "media-history") {
      onOpenMediaHistory?.();
    } else if (id === "protection") {
      onOpenProtection?.();
    } else if (id === "shield-panel") {
      onOpenShieldPanel?.();
    } else if (id === "security-events") {
      onOpenEvents?.();
    } else if (id === "settings") {
      onOpenSettings?.();
    } else if (id === "diagnostics") {
      onOpenDiagnostics?.();
    } else if (id === "exit") {
      void window.mine.closeWindow();
    }
    onClose();
  };

  const items: readonly MenuItem[] = [
    { id: "new-tab", icon: "➕", label: "New Tab", shortcut: "Ctrl+T" },
    { id: "new-window", icon: "🗔", label: "New Window", shortcut: "Ctrl+N" },
    { id: "private-window", icon: "🕶️", label: "Private Incognito Window", shortcut: "Ctrl+Shift+N" },
    { id: "command-center", icon: "⚡", label: "Command Palette", shortcut: "Ctrl+P" },
    { id: "browser-center", icon: "❖", label: "Browser Center", shortcut: "Ctrl+K" },
    { id: "downloads", icon: "📥", label: "Downloads Manager (Fetcher)", shortcut: "Ctrl+J" },
    { id: "media", icon: "🎬", label: "Media Stream Sniffer" },
    { id: "media-queue", icon: "📋", label: "Media Playback Queue" },
    { id: "media-history", icon: "📜", label: "Media History Log" },
    { id: "protection", icon: "🛡️", label: "Protection & Safety Center" },
    { id: "shield-panel", icon: "🛡", label: "AdBlock Shield Controls" },
    { id: "security-events", icon: "🚨", label: "Security Events Log" },
    { id: "settings", icon: "⚙️", label: "Settings & Options", shortcut: "Ctrl+," },
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
            style={{ animationDelay: `${index * 15}ms` }}
            onClick={() => handleAction(item.id)}
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
