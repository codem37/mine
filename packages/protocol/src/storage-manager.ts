import type { IPFSStorageStats } from "@mine/contracts";
import type { HeliaNode } from "./helia-node.js";

export class StorageManager {
  constructor(private readonly helia: HeliaNode) {}

  getStorageStats(): IPFSStorageStats {
    const status = this.helia.getStatus();
    const pinnedCount = this.helia.getPinnedCids().length;
    return {
      pinnedCount,
      cacheSizeBytes: status.repoSizeBytes,
      pinnedSizeBytes: pinnedCount * 2400000,
      availableBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    };
  }

  clearCache(): void {
    this.helia.clearCache();
  }
}
