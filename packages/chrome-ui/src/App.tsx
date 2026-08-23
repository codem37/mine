import { useEffect, useRef, useState } from "react";
import type { Telemetry, WindowState } from "@mine/contracts";
import type { JSX } from "react";
import { TabStrip } from "./components/TabStrip.js";
import { AddressBar } from "./components/AddressBar.js";
import { NavControls } from "./components/NavControls.js";
import { WindowControls } from "./components/WindowControls.js";
import { TelemetryRail } from "./components/TelemetryRail.js";
import { useLiveStats } from "./use-live-stats.js";

export function App(): JSX.Element {
  const { tabs: liveTabs, shield } = useLiveStats();
  const [maximized, setMaximized] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);

  useEffect(() => window.mine.onWindowState((state) => setMaximized(state.maximized)), []);
  useEffect(() => window.mine.onTelemetry(setTelemetry), []);

  const tabsPayload = liveTabs ?? { tabs: [], activeTabId: null };
  const active =
    tabsPayload.tabs.find((t) => t.id === tabsPayload.activeTabId) ?? null;

  return (
    <div className="hud">
      <header className="titlebar">
        <div className="brand" aria-hidden="true">
          MINE
        </div>
        <div className="drag-strip" />
        <NavControls active={active} />
        <AddressBar
          activeTabId={tabsPayload.activeTabId}
          activeUrl={active?.url ?? ""}
          shield={shield}
        />
        <WindowControls maximized={maximized} />
      </header>
      <aside className="rail" aria-label="browser rail">
        <section className="rail__section" aria-label="open tabs">
          <h2 className="rail__heading">tabs</h2>
          <TabStrip
            tabs={tabsPayload.tabs}
            activeTabId={tabsPayload.activeTabId}
          />
        </section>
        <TelemetryRail telemetry={telemetry} shield={shield} />
      </aside>
    </div>
  );
}

export function useDebouncedInput(
  external: string,
  delayMs = 250,
): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState(external);
  const timer = useRef<number | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setValue(external);
  }, [external]);

  const onChange = (v: string): void => {
    dirty.current = true;
    setValue(v);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dirty.current = false;
    }, delayMs) as unknown as number;
  };
  const reset = (): void => {
    if (timer.current !== null) clearTimeout(timer.current);
    dirty.current = false;
    setValue(external);
  };
  return [value, onChange, reset];
}
