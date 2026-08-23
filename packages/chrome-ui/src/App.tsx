import { useEffect, useState } from "react";
import type { DownloadItem, MediaSource, PlayerState, SecurityVerdict, Telemetry } from "@mine/contracts";
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
import { MediaIndicator } from "./components/MediaIndicator.js";
import { MediaActionBubble } from "./components/MediaActionBubble.js";
import { CinematicPlayer } from "./components/CinematicPlayer.js";
import { ProtectionCenter } from "./components/ProtectionCenter.js";
import { SecurityEventsModal } from "./components/SecurityEventsModal.js";
import { SecurityInterstitial } from "./components/SecurityInterstitial.js";
import { LookalikeWarningToast } from "./components/LookalikeWarningToast.js";
import { useLiveStats } from "./use-live-stats.js";

export function App(): JSX.Element {
  const { tabs: liveTabs, shield } = useLiveStats();
  const [maximized, setMaximized] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [downloads, setDownloads] = useState<readonly DownloadItem[]>([]);
  const [mediaSources, setMediaSources] = useState<readonly MediaSource[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [siteInfoOpen, setSiteInfoOpen] = useState(false);
  const [protectionCenterOpen, setProtectionCenterOpen] = useState(false);
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullFetcherOpen, setFullFetcherOpen] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [activePlayerSource, setActivePlayerSource] = useState<MediaSource | null>(null);
  const [securityVerdict, setSecurityVerdict] = useState<SecurityVerdict | null>(null);
  const [dismissedLookalike, setDismissedLookalike] = useState(false);

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

  useEffect(() => {
    let active = true;
    if (window.mine.getDetectedStreams) {
      void window.mine.getDetectedStreams().then((res) => {
        if (active && res.ok) setMediaSources(res.value);
      });
    }
    if (window.mine.onStreamDetected) {
      const off = window.mine.onStreamDetected((sources) => {
        if (active) setMediaSources(sources);
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

  useEffect(() => {
    let active = true;
    if (window.mine.onPlayerStateChanged) {
      const off = window.mine.onPlayerStateChanged((st) => {
        if (active) setPlayerState(st);
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

  useEffect(() => {
    let isCurrent = true;
    if (active?.url && window.mine.getSecurityVerdict) {
      void window.mine.getSecurityVerdict({ tabId: active.id, url: active.url }).then((res) => {
        if (isCurrent && res.ok && res.value) {
          setSecurityVerdict(res.value);
          setDismissedLookalike(false);
        }
      });
    }
    return () => {
      isCurrent = false;
    };
  }, [active?.url, active?.id]);

  const isFetcherUrl = active?.url === "mine://fetcher/" || active?.url === "mine://downloads/";

  // Trusted Full-Page Interstitial when navigation is blocked (Phishing/Malware)
  if (securityVerdict?.state === "blocked") {
    return (
      <SecurityInterstitial
        verdict={securityVerdict}
        onGoBack={() => {
          if (active && window.mine.navigate) {
            void window.mine.navigate({ tabId: active.id, url: "mine://newtab" });
          }
        }}
        onContinueAnyway={() => {
          if (active && window.mine.addSafetyException) {
            try {
              const host = new URL(active.url).hostname;
              void window.mine.addSafetyException({ domain: host, durationMinutes: 15 });
              setSecurityVerdict(null);
            } catch {
              // ignore
            }
          }
        }}
      />
    );
  }

  if (activePlayerSource) {
    return (
      <CinematicPlayer
        source={activePlayerSource}
        onClose={() => setActivePlayerSource(null)}
      />
    );
  }

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
          onToggleSiteInfo={() => setProtectionCenterOpen(!protectionCenterOpen)}
        />

        <MediaIndicator
          sources={mediaSources}
          isPlaying={playerState?.status === "playing"}
          onOpenBubble={() => setBubbleOpen(true)}
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

      {/* Look-alike Domain Warning Toast */}
      {securityVerdict?.state === "suspicious" && securityVerdict.category === "lookalike" && !dismissedLookalike ? (
        <LookalikeWarningToast
          verdict={securityVerdict}
          onClose={() => setDismissedLookalike(true)}
          onNavigateIntended={(url) => {
            if (active && window.mine.navigate) {
              void window.mine.navigate({ tabId: active.id, url });
            }
          }}
        />
      ) : null}

      {siteInfoOpen ? (
        <SiteInfoPopup
          activeUrl={active?.url ?? ""}
          shield={shield}
          onClose={() => setSiteInfoOpen(false)}
        />
      ) : null}

      {protectionCenterOpen ? (
        <ProtectionCenter
          onClose={() => setProtectionCenterOpen(false)}
          onOpenSiteInfo={() => {
            setProtectionCenterOpen(false);
            setSiteInfoOpen(true);
          }}
          onOpenEvents={() => {
            setProtectionCenterOpen(false);
            setEventsModalOpen(true);
          }}
        />
      ) : null}

      {eventsModalOpen ? (
        <SecurityEventsModal onClose={() => setEventsModalOpen(false)} />
      ) : null}

      {menuOpen ? (
        <MainMenu
          onClose={() => setMenuOpen(false)}
          onOpenDownloads={() => setFullFetcherOpen(true)}
        />
      ) : null}

      {bubbleOpen ? (
        <MediaActionBubble
          sources={mediaSources}
          onClose={() => setBubbleOpen(false)}
          onOpenPlayer={(src) => setActivePlayerSource(src)}
        />
      ) : null}

      <DownloadSystem
        downloads={downloads}
        onOpenFullFetcher={() => setFullFetcherOpen(true)}
      />
    </div>
  );
}
