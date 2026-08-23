import { useState, useMemo } from "react";
import type { CommandItem } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
  readonly onExecuteCommand: (action: string) => void;
}

const COMMAND_REGISTRY: readonly CommandItem[] = [
  { id: "cmd-new-tab", title: "New Tab", category: "BROWSER", shortcut: "Ctrl+T", action: "new-tab" },
  { id: "cmd-close-tab", title: "Close Active Tab", category: "BROWSER", shortcut: "Ctrl+W", action: "close-tab" },
  { id: "cmd-open-fetcher", title: "Open Fetcher Downloads", category: "FETCHER", shortcut: "Ctrl+J", action: "open-fetcher" },
  { id: "cmd-open-media", title: "Open Cinematic Media Manager", category: "MEDIA", action: "open-media" },
  { id: "cmd-open-protection", title: "Open Protection Center", category: "SAFETY", action: "open-protection" },
  { id: "cmd-open-browser-center", title: "Open Browser Center Overview", category: "SYSTEM", shortcut: "Ctrl+K", action: "open-browser-center" },
  { id: "cmd-open-settings", title: "Open Settings", category: "SETTINGS", shortcut: "Ctrl+,", action: "open-settings" },
  { id: "cmd-switch-workspace", title: "Switch Active Workspace", category: "WORKSPACES", action: "switch-workspace" },
  { id: "cmd-ipfs-settings", title: "Open Decentralized IPFS & ENS Settings", category: "PROTOCOLS", action: "ipfs-settings" },
  { id: "cmd-diagnostics", title: "Run Subsystem Health Diagnostics", category: "HEALTH", action: "open-diagnostics" },
];

export function CommandCenter({ onClose, onExecuteCommand }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMAND_REGISTRY;
    return COMMAND_REGISTRY.filter(
      (cmd) => cmd.title.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      onExecuteCommand(filteredCommands[selectedIndex]!.action);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="command-center-overlay" onClick={onClose} data-testid="command-center">
      <div className="command-center-card" onClick={(e) => e.stopPropagation()}>
        <div className="command-center__input-wrap">
          <span className="command-center__prompt">&gt;</span>
          <input
            value={query}
            autoFocus
            className="command-center__input"
            placeholder="Search commands (e.g. downloads, settings, workspace)..."
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="command-center__results">
          {filteredCommands.length === 0 ? (
            <div className="command-center__empty">No matching commands found.</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`command-item ${idx === selectedIndex ? "command-item--selected" : ""}`}
                onClick={() => onExecuteCommand(cmd.action)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="command-item__left">
                  <span className="command-item__category">{cmd.category}</span>
                  <span className="command-item__title">{cmd.title}</span>
                </div>
                {cmd.shortcut ? <span className="command-item__shortcut">{cmd.shortcut}</span> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
