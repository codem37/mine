import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { CHROME_HEIGHT, TAB_RAIL_WIDTH } from "@mine/contracts";

const injectedRoot = `:root {
  --hud-chrome-height: ${CHROME_HEIGHT}px;
  --hud-tab-rail-width: ${TAB_RAIL_WIDTH}px;
}`;

const contractsLayoutVars = {
  name: "mine-contracts-layout-vars",
  transform(code: string, id: string): string | undefined {
    if (id.endsWith("tokens.css")) {
      return `${code}\n${injectedRoot}\n`;
    }
    return undefined;
  },
};

export default defineConfig({
  plugins: [react(), contractsLayoutVars],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        newtab: resolve(__dirname, "newtab.html"),
      },
    },
  },
});
