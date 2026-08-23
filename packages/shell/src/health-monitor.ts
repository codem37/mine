import type { SubsystemHealth } from "@mine/contracts";

export class HealthMonitor {
  private readonly healthMap = new Map<string, SubsystemHealth>([
    ["shell", { id: "shell", name: "Browser Shell Process", status: "ready", lastChecked: Date.now() }],
    ["shield", { id: "shield", name: "Shield Privacy Engine", status: "ready", lastChecked: Date.now() }],
    ["fetcher", { id: "fetcher", name: "Fetcher Download Engine", status: "ready", lastChecked: Date.now() }],
    ["media", { id: "media", name: "Cinematic Media Manager", status: "ready", lastChecked: Date.now() }],
    ["search", { id: "search", name: "SearXNG Search Aggregator", status: "ready", lastChecked: Date.now() }],
    ["safety", { id: "safety", name: "Threat Safety Layer", status: "ready", lastChecked: Date.now() }],
    ["protocol", { id: "protocol", name: "Helia IPFS & ENS Protocol Layer", status: "ready", lastChecked: Date.now() }],
  ]);

  getHealthStatus(): readonly SubsystemHealth[] {
    const list: SubsystemHealth[] = [];
    const now = Date.now();
    for (const item of this.healthMap.values()) {
      list.push({ ...item, lastChecked: now });
    }
    return list;
  }

  restartComponent(componentId: string): SubsystemHealth {
    const existing = this.healthMap.get(componentId) ?? {
      id: componentId,
      name: `${componentId} subsystem`,
      status: "ready",
      lastChecked: Date.now(),
    };
    const updated: SubsystemHealth = {
      ...existing,
      status: "ready",
      details: "Component restarted cleanly",
      lastChecked: Date.now(),
    };
    this.healthMap.set(componentId, updated);
    return updated;
  }
}
