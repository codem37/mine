import { useEffect, useRef, useState } from "react";
import type { ShieldStats, TabsUpdatedPayload, Telemetry, WindowState } from "@mine/contracts";
import type { JSX } from "react";
import { TabStrip } from "./components/TabStrip.js";
import { AddressBar } from "./components/AddressBar.js";
import { WindowControls } from "./components/WindowControls.js";
import { TelemetryRail } from "./components/TelemetryRail.js";

const mine = window.mine;

export function App(): JSX.Element {
  const [tabsPayload, setTabs] = useState<TabsUpdatedPayload>({
    tabs: [],
    activeTabId: null,
  });
  const [maximized, setMaximized] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [shield, setShield] = useState<ShieldStats | null>(null);

  useEffect(() => mine.onTabsUpdated(setTabs), []);
  useEffect(() => mine.onWindowState((state) => setMaximized(state.maximized)), []);
  useEffect(() => mine.onTelemetry(setTelemetry), []);
  useEffect(() => mine.onShieldStats(setShield), []);

  const active =
    tabsPayload.tabs.find((t) => t.id === tabsPayload.activeTabId) ?? null;

  return (
    <div className="hud">
      <header className="titlebar">
        <div className="brand" aria-hidden="true">
          MINE
        </div>
        <div className="drag-strip" />
        <TabStrip
          tabs={tabsPayload.tabs}
          activeTabId={tabsPayload.activeTabId}
        />
        <AddressBar
          activeTabId={tabsPayload.activeTabId}
          activeUrl={active?.url ?? ""}
        />
        <WindowControls maximized={maximized} />
      </header>
      <TelemetryRail telemetry={telemetry} shield={shield} />
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
