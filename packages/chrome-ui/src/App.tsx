import { useEffect, useState } from "react";
import type { JSX } from "react";
import { TabStrip } from "./components/TabStrip.js";
import { AddressBar } from "./components/AddressBar.js";
import { NavControls } from "./components/NavControls.js";
import { WindowControls } from "./components/WindowControls.js";
import { useLiveStats } from "./use-live-stats.js";

export function App(): JSX.Element {
  const { tabs: liveTabs, shield } = useLiveStats();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => window.mine.onWindowState((state) => setMaximized(state.maximized)), []);

  const tabsPayload = liveTabs ?? { tabs: [], activeTabId: null };
  const active =
    tabsPayload.tabs.find((t) => t.id === tabsPayload.activeTabId) ?? null;

  return (
    <div className="hud">
      <header className="titlebar">
        <NavControls active={active} />
        <AddressBar
          activeTabId={tabsPayload.activeTabId}
          activeUrl={active?.url ?? ""}
          shield={shield}
        />
        <div className="avatar" aria-hidden="true">●</div>
        <WindowControls maximized={maximized} />
      </header>
      <aside className="rail--tabs" aria-label="tab rail">
        <TabStrip
          tabs={tabsPayload.tabs}
          activeTabId={tabsPayload.activeTabId}
        />
      </aside>
    </div>
  );
}
