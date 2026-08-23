import { useEffect, useState } from "react";
import type { DownloadItem, Telemetry } from "@mine/contracts";
import type { JSX } from "react";
import { TabStrip } from "./components/TabStrip.js";
import { AddressBar } from "./components/AddressBar.js";
import { NavControls } from "./components/NavControls.js";
import { WindowControls } from "./components/WindowControls.js";
import { NetworkSpeedIndicator } from "./components/NetworkSpeedIndicator.js";
import { SiteInfoPopup } from "./components/SiteInfoPopup.js";
import { MainMenu } from "./components/MainMenu.js";
import { DownloadSystem } from "./components/DownloadSystem.js";
import { FetcherPage } from "./components/FetcherPage.js";
import { useLiveStats } from "./use-live-stats.js";

export function App(): JSX.Element {
  const { tabs: liveTabs, shield } = useLiveStats();
  const [maximized, setMaximized] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [downloads, setDownloads] = useState<readonly DownloadItem[]>([]);
  const [siteInfoOpen, setSiteInfoOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullFetcherOpen, setFullFetcherOpen] = useState(false);

  useEffect(() => window.mine.onWindowState((state) => setMaximized(state.maximized)), []);
  useEffect(() => window.mine.onTelemetry(setTelemetry), []);

  useEffect(() => {
    let active = true;
    if (window.mine.getDownloads) {
      void window.mine.getDownloads().then((res) => {
        if (active && res.ok) setDownloads(res.value);
      });
    }
    if (window.mine.onDownloadsUpdated) {
      const off = window.mine.onDownloadsUpdated((items) => {
        if (active) setDownloads(items);
      });
      return () => {
        active = false;
        off();
      };
    }
    return () => {
      active = false;
    };
  }, []);

  const tabsPayload = liveTabs ?? { tabs: [], activeTabId: null };
  const active =
    tabsPayload.tabs.find((t) => t.id === tabsPayload.activeTabId) ?? null;

  const isFetcherUrl = active?.url === "mine://fetcher/" || active?.url === "mine://downloads/";

  if (fullFetcherOpen || isFetcherUrl) {
    return (
      <FetcherPage
        downloads={downloads}
        onClose={() => setFullFetcherOpen(false)}
      />
    );
  }

  return (
    <div className="hud">
      <header className="titlebar">
        <NavControls active={active} />
        
        <AddressBar
          activeTabId={tabsPayload.activeTabId}
          activeUrl={active?.url ?? ""}
          shield={shield}
          onToggleSiteInfo={() => setSiteInfoOpen(!siteInfoOpen)}
        />

        <NetworkSpeedIndicator
          netRequestsPerMinute={telemetry?.netRequestsPerMinute}
        />

        <button
          type="button"
          className="glass-btn"
          aria-label="main menu"
          title="Main Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ⋮
        </button>

        <WindowControls maximized={maximized} />
      </header>

      <aside className="rail--tabs" aria-label="tab rail">
        <TabStrip
          tabs={tabsPayload.tabs}
          activeTabId={tabsPayload.activeTabId}
        />
      </aside>

      {siteInfoOpen ? (
        <SiteInfoPopup
          activeUrl={active?.url ?? ""}
          shield={shield}
          onClose={() => setSiteInfoOpen(false)}
        />
      ) : null}

      {menuOpen ? (
        <MainMenu
          onClose={() => setMenuOpen(false)}
          onOpenDownloads={() => setFullFetcherOpen(true)}
        />
      ) : null}

      <DownloadSystem
        downloads={downloads}
        onOpenFullFetcher={() => setFullFetcherOpen(true)}
      />
    </div>
  );
}
