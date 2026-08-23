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
    getTabs: "mine:shell:get-tabs",
  },
  shield: {
    getStats: "mine:shield:get-stats",
    setEnabled: "mine:shield:set-enabled",
  },
  fetcher: {
    getDownloads: "mine:fetcher:get-downloads",
    pauseDownload: "mine:fetcher:pause-download",
    resumeDownload: "mine:fetcher:resume-download",
    cancelDownload: "mine:fetcher:cancel-download",
    retryDownload: "mine:fetcher:retry-download",
    openFile: "mine:fetcher:open-file",
    showInFolder: "mine:fetcher:show-in-folder",
    addDownload: "mine:fetcher:add-download",
    removeDownload: "mine:fetcher:remove-download",
    deleteFile: "mine:fetcher:delete-file",
    getStorageInfo: "mine:fetcher:get-storage-info",
  },
  media: {
    playNative: "mine:media:play-native",
    getDetectedStreams: "mine:media:get-detected-streams",
    getState: "mine:media:get-state",
    control: "mine:media:control",
    selectSource: "mine:media:select-source",
    downloadSource: "mine:media:download-source",
    loadSubtitle: "mine:media:load-subtitle",
    getDiagnostics: "mine:media:get-diagnostics",
  },
  search: {
    query: "mine:search:query",
    suggest: "mine:search:suggest",
    history: "mine:search:history",
    getDiagnostics: "mine:search:get-diagnostics",
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
  fetcher: {
    downloadsUpdated: "mine:fetcher:downloads-updated",
  },
  media: {
    streamDetected: "mine:media:stream-detected",
    playerStateChanged: "mine:media:player-state-changed",
  },
} as const;

type Flatten<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : Flatten<T[K]>;
}[keyof T];

export type IpcChannel = Flatten<typeof IPC_CHANNELS>;
export type IpcEvent = Flatten<typeof IPC_EVENTS>;
