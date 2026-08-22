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
  },
} as const;

export const IPC_EVENTS = {
  shell: {
    tabsUpdated: "mine:shell:tabs-updated",
  },
} as const;

type Flatten<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : Flatten<T[K]>;
}[keyof T];

export type IpcChannel = Flatten<typeof IPC_CHANNELS>;
export type IpcEvent = Flatten<typeof IPC_EVENTS>;
