import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BrowserCenter } from "./BrowserCenter.js";
import { CommandCenter } from "./CommandCenter.js";
import { SettingsModal } from "./SettingsModal.js";
import { WorkspaceSelector } from "./WorkspaceSelector.js";
import { HealthRecoveryModal } from "./HealthRecoveryModal.js";

describe("BrowserCenter component", () => {
  it("renders Browser Center overview cards", () => {
    const html = renderToStaticMarkup(
      <BrowserCenter
        activeWorkspace={{ id: "ws-1", name: "Personal", icon: "🏠", accent: "cyan", tabIds: ["tab-1", "tab-2"], activeTabId: "tab-1" }}
        onClose={() => {}}
        onOpenFetcher={() => {}}
        onOpenMedia={() => {}}
        onOpenProtection={() => {}}
        onOpenSettings={() => {}}
        onOpenHealth={() => {}}
      />
    );
    expect(html).toContain("Browser Center");
    expect(html).toContain("System Telemetry");
    expect(html).toContain("Downloads (Fetcher)");
    expect(html).toContain("Protection &amp; Safety");
  });
});

describe("CommandCenter component", () => {
  it("renders command palette input and items", () => {
    const html = renderToStaticMarkup(
      <CommandCenter onClose={() => {}} onExecuteCommand={() => {}} />
    );
    expect(html).toContain("Search commands");
    expect(html).toContain("New Tab");
    expect(html).toContain("Open Settings");
  });
});

describe("SettingsModal component", () => {
  it("renders settings navigation sidebar and content area", () => {
    const html = renderToStaticMarkup(
      <SettingsModal onClose={() => {}} initialSection="general" />
    );
    expect(html).toContain("Search settings...");
    expect(html).toContain("General");
    expect(html).toContain("Appearance");
    expect(html).toContain("Workspaces");
  });
});

describe("WorkspaceSelector component", () => {
  it("renders active workspace capsule label", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSelector
        workspaces={[
          { id: "ws-1", name: "Personal", icon: "🏠", accent: "cyan", tabIds: [], activeTabId: null },
        ]}
        activeWorkspaceId="ws-1"
        onSelectWorkspace={() => {}}
        onCreateWorkspace={() => {}}
      />
    );
    expect(html).toContain("Personal");
  });
});

describe("HealthRecoveryModal component", () => {
  it("renders health recovery title and buttons", () => {
    const html = renderToStaticMarkup(
      <HealthRecoveryModal onClose={() => {}} />
    );
    expect(html).toContain("Subsystem Health &amp; Component Recovery");
    expect(html).toContain("Re-run Health Check");
  });
});
