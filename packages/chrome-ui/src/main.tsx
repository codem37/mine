import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./tokens.css";
import "./chrome.css";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("missing #root mount point");
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
