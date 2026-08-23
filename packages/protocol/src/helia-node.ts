import type { IPFSResource } from "@mine/contracts";

export class HeliaNode {
  private readonly pinnedCids = new Set<string>();
  private readonly cachedCids = new Map<string, number>();
  private isRunning = true;

  constructor() {
    // Seed default pinned test CID
    this.pinnedCids.add("bafybeihd3255vgct7ly2la6wxj4nhwyipucpwj6ya6637e6g2vtfw2c2zq");
  }

  isCID(input: string): boolean {
    const trimmed = input.replace(/^ipfs:\/\//, "").trim();
    return trimmed.startsWith("bafy") || trimmed.startsWith("Qm") || trimmed.length >= 46;
  }

  extractCID(input: string): string {
    return input.replace(/^ipfs:\/\//, "").split("/")[0] || input;
  }

  async resolveResource(inputUri: string): Promise<IPFSResource> {
    const cid = this.extractCID(inputUri);
    if (!cid || cid.length < 10) {
      return {
        cid: inputUri,
        status: "invalid",
        cached: false,
        pinned: false,
      };
    }

    const isPinned = this.pinnedCids.has(cid);
    const isCached = this.cachedCids.has(cid);

    if (!isCached) {
      this.cachedCids.set(cid, 2400000); // 2.4MB sample size
    }

    return {
      cid,
      status: isPinned ? "pinned" : "cached",
      cached: true,
      pinned: isPinned,
      sizeBytes: this.cachedCids.get(cid) ?? 2400000,
      gatewayUsed: "Local Helia Node",
    };
  }

  pin(cid: string): void {
    const extracted = this.extractCID(cid);
    this.pinnedCids.add(extracted);
  }

  unpin(cid: string): void {
    const extracted = this.extractCID(cid);
    this.pinnedCids.delete(extracted);
  }

  isPinned(cid: string): boolean {
    return this.pinnedCids.has(this.extractCID(cid));
  }

  clearCache(): void {
    this.cachedCids.clear();
  }

  getPinnedCids(): readonly string[] {
    return Array.from(this.pinnedCids);
  }

  getStatus(): { isRunning: boolean; peerCount: number; repoSizeBytes: number } {
    let size = 0;
    for (const s of this.cachedCids.values()) size += s;
    return {
      isRunning: this.isRunning,
      peerCount: 12,
      repoSizeBytes: size,
    };
  }
}
