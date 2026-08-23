import os from "node:os";
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { DownloadEngine } from "./engine.js";

describe("DownloadEngine manager", () => {
  let tempDir: string;
  let engine: DownloadEngine;

  beforeAll(async () => {
    tempDir = path.join(os.tmpdir(), `mine-engine-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    engine = new DownloadEngine(tempDir);
  });

  afterAll(async () => {
    engine.dispose();
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("creates and tracks downloads with event notifications", async () => {
    let notified = false;
    const unsub = engine.on((items) => {
      if (items.length > 0) notified = true;
    });

    const magnet = "magnet:?xt=urn:btih:0000111122223333444455556666777788889999&dn=test.iso&xl=1024";
    const item = await engine.startDownload(magnet, { saveDir: tempDir });

    expect(item.id).toMatch(/^dl-\d+$/);
    expect(engine.getDownloads().length).toBe(1);
    expect(engine.getDownload(item.id)).toBeDefined();
    expect(notified).toBe(true);

    engine.pause(item.id);
    expect(["paused", "downloading", "completed"]).toContain(engine.getDownload(item.id)?.state);

    engine.cancel(item.id);
    expect(engine.getDownload(item.id)?.state).toBe("cancelled");

    unsub();
  });
});
