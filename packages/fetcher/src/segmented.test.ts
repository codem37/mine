import http from "node:http";
import os from "node:os";
import path from "node:path";
import { mkdir, readFile, rm } from "node:fs/promises";
import crypto from "node:crypto";
import { describe, expect, it, afterAll, beforeAll } from "vitest";
import { SegmentedDownload } from "./segmented.js";

describe("SegmentedDownload engine", () => {
  let server: http.Server;
  let serverUrl: string;
  let noRangeServerUrl: string;
  let testData: Buffer;
  let testDataHash: string;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = path.join(os.tmpdir(), `mine-fetcher-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Generate 512 KB of pseudorandom binary payload
    testData = crypto.randomBytes(512 * 1024);
    testDataHash = crypto.createHash("sha256").update(testData).digest("hex");

    server = http.createServer((req, res) => {
      const url = req.url || "";
      if (url.includes("norange")) {
        // Server does not support ranges
        if (req.method === "HEAD") {
          res.writeHead(200, {
            "Content-Length": String(testData.length),
            "Content-Type": "application/octet-stream",
          });
          res.end();
          return;
        }
        res.writeHead(200, {
          "Content-Length": String(testData.length),
          "Content-Type": "application/octet-stream",
        });
        res.end(testData);
        return;
      }

      if (req.method === "HEAD") {
        res.writeHead(200, {
          "Accept-Ranges": "bytes",
          "Content-Length": String(testData.length),
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="payload.bin"',
        });
        res.end();
        return;
      }

      const rangeHeader = req.headers.range;
      if (rangeHeader && rangeHeader.startsWith("bytes=")) {
        const parts = rangeHeader.replace("bytes=", "").split("-");
        const start = Number.parseInt(parts[0] || "0", 10);
        const end = parts[1] ? Number.parseInt(parts[1], 10) : testData.length - 1;

        const slice = testData.subarray(start, end + 1);
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${testData.length}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(slice.length),
          "Content-Type": "application/octet-stream",
        });
        res.end(slice);
      } else {
        res.writeHead(200, {
          "Accept-Ranges": "bytes",
          "Content-Length": String(testData.length),
          "Content-Type": "application/octet-stream",
        });
        res.end(testData);
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (address && typeof address === "object") {
          serverUrl = `http://127.0.0.1:${address.port}/payload.bin`;
          noRangeServerUrl = `http://127.0.0.1:${address.port}/norange.bin`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("downloads payload using 8 parallel segments and produces bit-perfect file", async () => {
    const download = new SegmentedDownload({
      id: "dl-test-1",
      url: serverUrl,
      saveDir: tempDir,
      segmentCount: 8,
    });

    await download.start();
    const snapshot = download.getSnapshot();
    expect(snapshot.state).toBe("completed");
    expect(snapshot.downloadedBytes).toBe(testData.length);
    expect(snapshot.segments.length).toBe(8);

    const savedFile = await readFile(path.join(tempDir, "payload.bin"));
    const savedHash = crypto.createHash("sha256").update(savedFile).digest("hex");
    expect(savedHash).toBe(testDataHash);
  });

  it("gracefully falls back to single-stream when server lacks range support", async () => {
    const download = new SegmentedDownload({
      id: "dl-test-fallback",
      url: noRangeServerUrl,
      filename: "norange_output.bin",
      saveDir: tempDir,
    });

    await download.start();
    const snapshot = download.getSnapshot();
    expect(snapshot.state).toBe("completed");
    expect(snapshot.downloadedBytes).toBe(testData.length);

    const savedFile = await readFile(path.join(tempDir, "norange_output.bin"));
    const savedHash = crypto.createHash("sha256").update(savedFile).digest("hex");
    expect(savedHash).toBe(testDataHash);
  });

  it("supports pause and resume, completing with full integrity", async () => {
    const download = new SegmentedDownload({
      id: "dl-test-resume",
      url: serverUrl,
      filename: "resume_output.bin",
      saveDir: tempDir,
      segmentCount: 4,
    });

    const startPromise = download.start();
    // Pause immediately to interrupt
    download.pause();
    await startPromise;

    expect(download.getSnapshot().state).toBe("paused");

    // Resume download to completion
    await download.resume();
    expect(download.getSnapshot().state).toBe("completed");

    const savedFile = await readFile(path.join(tempDir, "resume_output.bin"));
    const savedHash = crypto.createHash("sha256").update(savedFile).digest("hex");
    expect(savedHash).toBe(testDataHash);
  });
});
