import os from "node:os";
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { parseMagnetUri, TorrentDownload } from "./torrent.js";

describe("torrent & magnet parsing", () => {
  it("parses magnet URI with hash, name, length, and trackers", () => {
    const uri = "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b33537709a23e290&dn=ArchLinux.iso&xl=850000000&tr=udp%3A%2F%2Ftracker.example.com%3A1337";
    const parsed = parseMagnetUri(uri);
    expect(parsed).not.toBeNull();
    expect(parsed?.infoHash).toBe("c12fe1c06bba254a9dc9f519b33537709a23e290");
    expect(parsed?.name).toBe("ArchLinux.iso");
    expect(parsed?.exactLength).toBe(850000000);
    expect(parsed?.trackers.length).toBe(1);
  });

  it("returns null for non-magnet URIs", () => {
    expect(parseMagnetUri("https://example.com/file.torrent")).toBeNull();
  });
});

describe("TorrentDownload engine simulation", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = path.join(os.tmpdir(), `mine-torrent-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("progresses torrent download, reports peers and completes", async () => {
    const uri = "magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678&dn=sample.iso&xl=4096";
    const download = new TorrentDownload({
      id: "tor-1",
      magnetUri: uri,
      saveDir: tempDir,
    });

    await download.start();

    // Wait until completed
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        const snap = download.getSnapshot();
        if (snap.state === "completed") {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });

    const snapshot = download.getSnapshot();
    expect(snapshot.state).toBe("completed");
    expect(snapshot.isTorrent).toBe(true);
    expect(snapshot.peersCount).toBeGreaterThan(0);
    expect(snapshot.downloadedBytes).toBe(4096);
  });
});
