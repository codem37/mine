import { useState, useEffect, StrictMode } from "react";
import type { JSX } from "react";
import { createRoot } from "react-dom/client";
import type { DownloadItem } from "@mine/contracts";
import { FetcherPage } from "./components/FetcherPage.js";
import "./tokens.css";
import "./chrome.css";

function StandaloneFetcher(): JSX.Element {
  const [downloads, setDownloads] = useState<readonly DownloadItem[]>([]);

  useEffect(() => {
    let active = true;
    if (window.mine.getDownloads) {
      void window.mine.getDownloads().then((res) => {
        if (active && res.ok) setDownloads(res.value);
      });
    }
    if (window.mine.onDownloadsUpdated) {
      const off = window.mine.onDownloadsUpdated((items) => {
        if (active) setDownloads(items);
      });
      return () => {
        active = false;
        off();
      };
    }
    return () => {
      active = false;
    };
  }, []);

  return <FetcherPage downloads={downloads} />;
}

const root = document.getElementById("root");
if (root !== null) {
  createRoot(root).render(
    <StrictMode>
      <StandaloneFetcher />
    </StrictMode>,
  );
}
