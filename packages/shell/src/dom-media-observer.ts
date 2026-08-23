/**
 * DOM Media Observer script injected into WebContentsView.
 * Monitors HTML5 <video>, <audio>, MSE, and blob media activity.
 */

export const DOM_MEDIA_OBSERVER_SCRIPT = `
(function() {
  if (window.__mineMediaObserverInjected) return;
  window.__mineMediaObserverInjected = true;

  function reportElement(el) {
    if (!el || !(el instanceof HTMLMediaElement)) return;
    const src = el.currentSrc || el.src;
    if (!src) return;
    try {
      const isVideo = el instanceof HTMLVideoElement;
      const isBlob = src.startsWith("blob:");
      const mime = isVideo ? "video/mp4" : "audio/mp3";
      const width = isVideo ? el.videoWidth || 1920 : undefined;
      const height = isVideo ? el.videoHeight || 1080 : undefined;

      if (window.ipcRenderer || (window.electron && window.electron.ipcRenderer)) {
        const ipc = window.ipcRenderer || window.electron.ipcRenderer;
        ipc.send("mine:media:dom-detected", {
          url: src,
          mimeType: mime,
          title: document.title || "Webpage Media",
          width,
          height,
          isBlob,
          isPlaying: !el.paused,
          duration: el.duration || 0,
        });
      }
    } catch (e) {
      // ignore DOM security exceptions
    }
  }

  function scanMedia() {
    document.querySelectorAll("video, audio").forEach(reportElement);
  }

  // MutationObserver to watch newly added video/audio elements
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          if (node instanceof HTMLMediaElement) reportElement(node);
          else if (node.querySelectorAll) node.querySelectorAll("video, audio").forEach(reportElement);
        }
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Listen to play events
  document.addEventListener("play", (e) => {
    if (e.target instanceof HTMLMediaElement) reportElement(e.target);
  }, true);

  // Initial scan
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanMedia);
  } else {
    scanMedia();
  }
})();
`;
