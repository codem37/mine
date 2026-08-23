import { describe, expect, it } from "vitest";
import { ProtocolManager } from "./protocol-manager.js";

describe("ProtocolManager Phase 8", () => {
  it("resolves .eth domain names and returns ENS resolution info", async () => {
    const mgr = new ProtocolManager();
    const route = await mgr.resolveUrl("vitalik.eth");

    expect(route.protocol).toBe("ens");
    expect(route.resolvedUrl).toContain("ipfs://");

    const info = await mgr.getProtocolInfo("vitalik.eth");
    expect(info.protocol).toBe("ens");
    expect(info.ens?.name).toBe("vitalik.eth");
    expect(info.ens?.address).toBe("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  });

  it("resolves direct ipfs:// URIs and identifies content types", async () => {
    const mgr = new ProtocolManager();
    const mediaRoute = await mgr.resolveUrl("ipfs://bafybeicn7e3v2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z/video.mp4");

    expect(mediaRoute.protocol).toBe("ipfs");
    expect(mediaRoute.contentType).toBe("media");

    const info = await mgr.getProtocolInfo("ipfs://bafybeicn7e3v2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z");
    expect(info.protocol).toBe("ipfs");
    expect(info.ipfs?.cid).toBe("bafybeicn7e3v2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z");
  });

  it("manages IPFS pinning and storage stats", async () => {
    const mgr = new ProtocolManager();
    const cid = "bafybeihd3255vgct7ly2la6wxj4nhwyipucpwj6ya6637e6g2vtfw2c2zq";

    expect(mgr.helia.isPinned(cid)).toBe(true);

    mgr.helia.unpin(cid);
    expect(mgr.helia.isPinned(cid)).toBe(false);

    mgr.helia.pin(cid);
    expect(mgr.helia.isPinned(cid)).toBe(true);

    const stats = mgr.storage.getStorageStats();
    expect(stats.pinnedCount).toBeGreaterThanOrEqual(1);
  });
});
