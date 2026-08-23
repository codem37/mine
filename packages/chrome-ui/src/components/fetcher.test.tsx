import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { DownloadItem } from "@mine/contracts";
import { FileIcon } from "./FileIcon.js";
import { FetcherCard, FetcherPage } from "./FetcherPage.js";

function makeDownload(overrides: Partial<DownloadItem> = {}): DownloadItem {
  return {
    id: "dl-1",
    filename: "ubuntu-26.04-desktop-amd64.iso",
    url: "https://releases.ubuntu.com/26.04/ubuntu.iso",
    state: "downloading",
    downloadedBytes: 2860000000,
    totalBytes: 4200000000,
    speedBytesPerSec: 14700000,
    etaSeconds: 42,
    segments: [],
    ...overrides,
  };
}

describe("FileIcon component", () => {
  it("renders ISO icon for disk images", () => {
    const html = renderToStaticMarkup(<FileIcon filename="ubuntu.iso" />);
    expect(html).toContain("💿");
  });

  it("renders PDF icon for pdf files", () => {
    const html = renderToStaticMarkup(<FileIcon filename="document.pdf" />);
    expect(html).toContain("📄");
  });

  it("renders Torrent icon when isTorrent flag is set", () => {
    const html = renderToStaticMarkup(<FileIcon filename="debian.iso" isTorrent={true} />);
    expect(html).toContain("⚡");
  });
});

describe("FetcherCard component", () => {
  it("renders filename, percentage, and domain source", () => {
    const item = makeDownload();
    const html = renderToStaticMarkup(<FetcherCard item={item} />);
    expect(html).toContain("ubuntu-26.04-desktop-amd64.iso");
    expect(html).toContain("releases.ubuntu.com");
    expect(html).toContain("68%");
  });

  it("renders contextual action buttons for downloading state", () => {
    const item = makeDownload({ state: "downloading" });
    const html = renderToStaticMarkup(<FetcherCard item={item} />);
    expect(html).toContain(">Pause<");
  });
});

describe("FetcherPage component", () => {
  it("renders header, search bar, and add download button", () => {
    const html = renderToStaticMarkup(<FetcherPage downloads={[makeDownload()]} />);
    expect(html).toContain("Fetcher");
    expect(html).toContain("Downloads &amp; Transfers");
    expect(html).toContain("Search downloads...");
    expect(html).toContain("+ Add Download");
  });
});
