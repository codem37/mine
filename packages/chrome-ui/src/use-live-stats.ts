import { useEffect, useState } from "react";
import type { ShieldStats, TabsUpdatedPayload } from "@mine/contracts";

export interface LiveStats {
  readonly tabs: TabsUpdatedPayload | null;
  readonly shield: ShieldStats | null;
}

export function useLiveStats(): LiveStats {
  const [tabs, setTabs] = useState<TabsUpdatedPayload | null>(null);
  const [shield, setShield] = useState<ShieldStats | null>(null);

  useEffect(() => {
    const mine = window.mine;
    let active = true;
    void mine.getTabs().then((result) => {
      if (active && result.ok) setTabs(result.value);
    });
    void mine.getShieldStats().then((result) => {
      if (active && result.ok) setShield(result.value);
    });
    const offTabs = mine.onTabsUpdated(setTabs);
    const offShield = mine.onShieldStats(setShield);
    return (): void => {
      active = false;
      offTabs();
      offShield();
    };
  }, []);

  return { tabs, shield };
}
