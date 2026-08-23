import { useState } from "react";
import type { Workspace } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly workspaces: readonly Workspace[];
  readonly activeWorkspaceId: string;
  readonly onSelectWorkspace: (id: string) => void;
  readonly onCreateWorkspace: (name: string, icon: string, accent: string) => void;
}

export function WorkspaceSelector({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
}: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("◇");
  const [newAccent, setNewAccent] = useState("cyan");

  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  return (
    <div className="workspace-selector-wrap" data-testid="workspace-selector">
      <button
        type="button"
        className="workspace-capsule-btn"
        onClick={() => setOpen(!open)}
        title="Switch Workspace"
      >
        <span className="workspace-capsule__icon">{active?.icon ?? "🏠"}</span>
        <span className="workspace-capsule__name">{active?.name ?? "Personal"}</span>
        <span className="workspace-capsule__arrow">▾</span>
      </button>

      {open ? (
        <div className="workspace-dropdown" onClick={() => setOpen(false)}>
          <div className="workspace-dropdown__card" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-list">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  className={`workspace-item ${ws.id === activeWorkspaceId ? "workspace-item--active" : ""}`}
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setOpen(false);
                  }}
                >
                  <span className="workspace-item__icon">{ws.icon}</span>
                  <span className="workspace-item__name">{ws.name}</span>
                </button>
              ))}
            </div>

            <div className="workspace-dropdown__footer">
              <button
                type="button"
                className="glass-btn glass-btn--sm"
                onClick={() => setShowCreate(!showCreate)}
              >
                + New Workspace
              </button>
            </div>

            {showCreate ? (
              <div className="workspace-create-form">
                <input
                  value={newName}
                  className="workspace-create__input"
                  placeholder="Workspace Name"
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="workspace-create__actions">
                  <button
                    type="button"
                    className="glass-btn glass-btn--sm glass-btn--primary"
                    onClick={() => {
                      if (newName.trim()) {
                        onCreateWorkspace(newName.trim(), newIcon, newAccent);
                        setNewName("");
                        setShowCreate(false);
                        setOpen(false);
                      }
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
