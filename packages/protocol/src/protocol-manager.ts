import type { ProtocolInfoPayload } from "@mine/contracts";
import { ENSResolver } from "./ens-resolver.js";
import { HeliaNode } from "./helia-node.js";
import { StorageManager } from "./storage-manager.js";

export class ProtocolManager {
  readonly ens = new ENSResolver();
  readonly helia = new HeliaNode();
  readonly storage = new StorageManager(this.helia);

  async resolveUrl(inputUrl: string): Promise<{
    protocol: "ipfs" | "ens" | "https";
    resolvedUrl: string;
    contentType?: "web" | "media" | "file";
  }> {
    const trimmed = inputUrl.trim();

    // 1. ENS Check (.eth)
    if (this.ens.isENSName(trimmed)) {
      const ensRes = await this.ens.resolve(trimmed);
      if (ensRes.status === "resolved" && ensRes.contentTarget) {
        if (ensRes.contentTarget.startsWith("ipfs://")) {
          return {
            protocol: "ens",
            resolvedUrl: ensRes.contentTarget,
            contentType: "web",
          };
        }
        return {
          protocol: "ens",
          resolvedUrl: ensRes.contentTarget,
          contentType: "web",
        };
      }
      return {
        protocol: "ens",
        resolvedUrl: trimmed,
        contentType: "web",
      };
    }

    // 2. Direct IPFS Check
    if (trimmed.startsWith("ipfs://") || this.helia.isCID(trimmed)) {
      const cid = this.helia.extractCID(trimmed);
      let contentType: "web" | "media" | "file" = "web";
      if (trimmed.endsWith(".mp4") || trimmed.endsWith(".m3u8") || trimmed.endsWith(".mp3")) {
        contentType = "media";
      } else if (trimmed.endsWith(".zip") || trimmed.endsWith(".pdf") || trimmed.endsWith(".exe")) {
        contentType = "file";
      }
      return {
        protocol: "ipfs",
        resolvedUrl: `ipfs://${cid}`,
        contentType,
      };
    }

    return {
      protocol: "https",
      resolvedUrl: trimmed,
      contentType: "web",
    };
  }

  async getProtocolInfo(inputUrl: string): Promise<ProtocolInfoPayload> {
    const route = await this.resolveUrl(inputUrl);

    if (route.protocol === "ens") {
      const ensRes = await this.ens.resolve(inputUrl);
      let ipfsRes;
      if (ensRes.contentTarget?.startsWith("ipfs://")) {
        ipfsRes = await this.helia.resolveResource(ensRes.contentTarget);
      }
      return {
        protocol: "ens",
        ens: ensRes,
        ipfs: ipfsRes,
        storage: this.storage.getStorageStats(),
      };
    }

    if (route.protocol === "ipfs") {
      const ipfsRes = await this.helia.resolveResource(inputUrl);
      return {
        protocol: "ipfs",
        ipfs: ipfsRes,
        storage: this.storage.getStorageStats(),
      };
    }

    return {
      protocol: "https",
    };
  }
}
