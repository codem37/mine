import { describe, expect, it } from "vitest";
import { SafetyEngine } from "./engine.js";

describe("SafetyEngine Phase 7", () => {
  it("evaluates known phishing domain as blocked with high severity", () => {
    const engine = new SafetyEngine();
    const verdict = engine.evaluateUrl("https://phishing.test/login");

    expect(verdict.state).toBe("blocked");
    expect(verdict.category).toBe("phishing");
    expect(verdict.severity).toBe(4);
    expect(verdict.action).toBe("block");
    expect(verdict.source).toBe("OpenPhish");
  });

  it("evaluates look-alike domain (paypaI.example) as suspicious with intended URL suggestion", () => {
    const engine = new SafetyEngine();
    const verdict = engine.evaluateUrl("https://paypaI.example/signin");

    expect(verdict.state).toBe("suspicious");
    expect(verdict.category).toBe("lookalike");
    expect(verdict.severity).toBe(2);
    expect(verdict.action).toBe("warn");
    expect(verdict.intendedUrl).toBe("https://paypal.com");
  });

  it("handles temporary exceptions and allows domain during exception window", () => {
    const engine = new SafetyEngine();
    engine.addException("phishing.test", 15);

    const verdict = engine.evaluateUrl("https://phishing.test/login");
    expect(verdict.state).toBe("safe");
    expect(verdict.action).toBe("allow");

    engine.removeException("phishing.test");
    const blockedVerdict = engine.evaluateUrl("https://phishing.test/login");
    expect(blockedVerdict.state).toBe("blocked");
  });

  it("logs security events when threats or suspicious sites are detected", () => {
    const engine = new SafetyEngine();
    engine.evaluateUrl("https://malware.test/binary.exe");

    const events = engine.getEvents();
    expect(events.length).toBe(1);
    expect(events[0]?.threatType).toBe("malware");
    expect(events[0]?.domain).toBe("malware.test");
  });
});
