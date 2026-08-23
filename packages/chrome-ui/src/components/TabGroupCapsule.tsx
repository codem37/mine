import type { TabGroup } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly group: TabGroup;
  readonly onToggleCollapse: (groupId: string) => void;
}

export function TabGroupCapsule({ group, onToggleCollapse }: Props): JSX.Element {
  return (
    <div
      className={`tab-group-capsule ${group.collapsed ? "tab-group-capsule--collapsed" : ""}`}
      style={{ borderColor: `var(--hud-${group.color}, var(--hud-cyan))` }}
      onClick={() => onToggleCollapse(group.id)}
      title={`Tab Group: ${group.name} (${group.tabIds.length} tabs)`}
      data-testid="tab-group-capsule"
    >
      <span className="tab-group-capsule__name">{group.name}</span>
      <span className="tab-group-capsule__badge">{group.tabIds.length}</span>
    </div>
  );
}
