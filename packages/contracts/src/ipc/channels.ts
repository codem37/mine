export const IPC_CHANNELS = {
  shell: {
    navigate: "mine:shell:navigate",
    newTab: "mine:shell:new-tab",
    closeTab: "mine:shell:close-tab",
    activateTab: "mine:shell:activate-tab",
    goBack: "mine:shell:go-back",
    goForward: "mine:shell:go-forward",
    reload: "mine:shell:reload",
    stop: "mine:shell:stop",
    minimizeWindow: "mine:shell:minimize-window",
    toggleMaximizeWindow: "mine:shell:toggle-maximize-window",
    closeWindow: "mine:shell:close-window",
  },
} as const;

export const IPC_EVENTS = {
  shell: {
    tabsUpdated: "mine:shell:tabs-updated",
    windowStateChanged: "mine:shell:window-state-changed",
    telemetryUpdated: "mine:shell:telemetry-updated",
  },
  shield: {
    statsUpdated: "mine:shield:stats-updated",
  },
} as const;

type Flatten<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : Flatten<T[K]>;
}[keyof T];

export type IpcChannel = Flatten<typeof IPC_CHANNELS>;
export type IpcEvent = Flatten<typeof IPC_EVENTS>;
