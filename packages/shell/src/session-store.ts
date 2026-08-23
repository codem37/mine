import type { SessionState } from "@mine/contracts";

const DEFAULT_SESSION: SessionState = {
  workspaces: [
    { id: "ws-personal", name: "Personal", icon: "🏠", accent: "cyan", tabIds: [], activeTabId: null },
    { id: "ws-research", name: "Research", icon: "🔬", accent: "purple", tabIds: [], activeTabId: null },
    { id: "ws-work", name: "Work", icon: "💼", accent: "green", tabIds: [], activeTabId: null },
  ],
  activeWorkspaceId: "ws-personal",
  tabGroups: [
    { id: "grp-dev", name: "Development", color: "cyan", tabIds: [], collapsed: false },
  ],
  crashed: false,
};

export class SessionStore {
  private currentState: SessionState = { ...DEFAULT_SESSION };

  getState(): SessionState {
    return this.currentState;
  }

  saveState(state: Partial<SessionState>): SessionState {
    this.currentState = {
      ...this.currentState,
      ...state,
    };
    return this.currentState;
  }

  clearState(): void {
    this.currentState = { ...DEFAULT_SESSION };
  }
}
