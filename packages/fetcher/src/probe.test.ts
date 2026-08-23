import http from "node:http";
import { describe, expect, it, afterAll, beforeAll } from "vitest";
import {
  extractFilenameFromDisposition,
  extractFilenameFromUrl,
  probeUrl,
} from "./probe.js";

describe("probe utilities", () => {
  it("extracts filename from simple Content-Disposition header", () => {
    expect(extractFilenameFromDisposition('attachment; filename="setup.exe"')).toBe("setup.exe");
    expect(extractFilenameFromDisposition("inline; filename=document.pdf")).toBe("document.pdf");
  });

  it("extracts encoded UTF-8 filename from Content-Disposition", () => {
    expect(
      extractFilenameFromDisposition("attachment; filename*=UTF-8''my%20report.pdf"),
    ).toBe("my report.pdf");
  });

  it("extracts filename from URL pathname", () => {
    expect(extractFilenameFromUrl("https://example.com/files/archive.tar.gz?token=123")).toBe("archive.tar.gz");
    expect(extractFilenameFromUrl("https://example.com/")).toBe("download.bin");
  });
});

describe("probeUrl server inspection", () => {
  let server: http.Server;
  let serverUrl: string;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.method === "HEAD") {
        res.writeHead(200, {
          "Accept-Ranges": "bytes",
          "Content-Length": "1048576",
          "Content-Disposition": 'attachment; filename="data.zip"',
          "Content-Type": "application/zip",
        });
        res.end();
      } else {
        res.writeHead(200);
        res.end("OK");
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (address && typeof address === "object") {
          serverUrl = `http://127.0.0.1:${address.port}/data.zip`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("probes server HEAD and detects range support, length, and filename", async () => {
    const probe = await probeUrl(serverUrl);
    expect(probe.acceptsRanges).toBe(true);
    expect(probe.contentLength).toBe(1048576);
    expect(probe.filename).toBe("data.zip");
    expect(probe.contentType).toBe("application/zip");
  });
});
