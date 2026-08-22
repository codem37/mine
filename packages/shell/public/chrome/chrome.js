const mine = window.mine;

let activeTabId = null;
const urlInput = document.getElementById("url");
const tabsList = document.getElementById("tabs");

document.getElementById("back").addEventListener("click", () => {
  if (activeTabId !== null) void mine.goBack({ tabId: activeTabId });
});
document.getElementById("fwd").addEventListener("click", () => {
  if (activeTabId !== null) void mine.goForward({ tabId: activeTabId });
});
document.getElementById("reload").addEventListener("click", () => {
  if (activeTabId !== null) void mine.reload({ tabId: activeTabId });
});
document.getElementById("stop").addEventListener("click", () => {
  if (activeTabId !== null) void mine.stop({ tabId: activeTabId });
});
document.getElementById("newtab").addEventListener("click", () => {
  void mine.newTab();
});

document.getElementById("go").addEventListener("submit", (event) => {
  event.preventDefault();
  if (activeTabId === null) return;
  const raw = urlInput.value.trim();
  const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  void mine.navigate({ tabId: activeTabId, url }).then((result) => {
    if (!result.ok) console.error(result.error.message);
  });
});

function render(payload) {
  activeTabId = payload.activeTabId;
  tabsList.replaceChildren(
    ...payload.tabs.map((tab) => {
      const li = document.createElement("li");
      li.textContent = `${tab.title || tab.url} `;
      if (tab.id === payload.activeTabId) {
        li.className = "active";
        if (document.activeElement !== urlInput) {
          urlInput.value =
            tab.loadState === "failed" ? `${tab.url} (failed)` : tab.url;
        }
      }
      const close = document.createElement("span");
      close.className = "close";
      close.textContent = "x";
      close.addEventListener("click", (event) => {
        event.stopPropagation();
        void mine.closeTab({ tabId: tab.id });
      });
      li.appendChild(close);
      li.addEventListener("click", () => {
        void mine.activateTab({ tabId: tab.id });
      });
      return li;
    }),
  );
}

mine.onTabsUpdated(render);

const shieldEl = document.getElementById("shield");
mine.onShieldStats((stats) => {
  shieldEl.textContent =
    stats.engineState === "ready"
      ? String(stats.blockedCount)
      : `${stats.blockedCount} (${stats.engineState})`;
});
