import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { SecurityVerdict } from "@mine/contracts";
import { ProtectionIndicator } from "./ProtectionIndicator.js";
import { ProtectionCenter } from "./ProtectionCenter.js";
import { SecurityInterstitial } from "./SecurityInterstitial.js";
import { LookalikeWarningToast } from "./LookalikeWarningToast.js";

function makeVerdict(overrides: Partial<SecurityVerdict> = {}): SecurityVerdict {
  return {
    state: "blocked",
    category: "phishing",
    severity: 4,
    source: "OpenPhish",
    reason: "Credential phishing target",
    url: "https://phishing.test/login",
    timestamp: Date.now(),
    action: "block",
    ...overrides,
  };
}

describe("ProtectionIndicator component", () => {
  it("renders safe shield icon by default", () => {
    const html = renderToStaticMarkup(<ProtectionIndicator state="safe" onClick={() => {}} />);
    expect(html).toContain("🛡");
  });

  it("renders dangerous blocked icon when state is blocked", () => {
    const html = renderToStaticMarkup(<ProtectionIndicator state="blocked" onClick={() => {}} />);
    expect(html).toContain("⛔");
  });
});

describe("ProtectionCenter component", () => {
  it("renders Privacy and Safety statistics separately", () => {
    const html = renderToStaticMarkup(
      <ProtectionCenter onClose={() => {}} onOpenSiteInfo={() => {}} onOpenEvents={() => {}} />
    );
    expect(html).toContain("Protection Center");
    expect(html).toContain("Privacy");
    expect(html).toContain("Safety");
    expect(html).toContain("Protection Data");
  });
});

describe("SecurityInterstitial component", () => {
  it("renders trusted full-page warning with primary Go Back button and Continue anyway exception", () => {
    const verdict = makeVerdict();
    const html = renderToStaticMarkup(
      <SecurityInterstitial verdict={verdict} onGoBack={() => {}} onContinueAnyway={() => {}} />
    );
    expect(html).toContain("Dangerous Phishing Site");
    expect(html).toContain("Go Back");
    expect(html).toContain("Continue anyway (15m exception)");
  });
});

describe("LookalikeWarningToast component", () => {
  it("renders warning for look-alike domain with intended URL button", () => {
    const verdict = makeVerdict({
      state: "suspicious",
      category: "lookalike",
      severity: 2,
      action: "warn",
      url: "https://paypaI.example/signin",
      intendedUrl: "https://paypal.com",
    });
    const html = renderToStaticMarkup(
      <LookalikeWarningToast verdict={verdict} onNavigateIntended={() => {}} onClose={() => {}} />
    );
    expect(html).toContain("Possible Impersonation Domain");
    expect(html).toContain("https://paypal.com");
  });
});
