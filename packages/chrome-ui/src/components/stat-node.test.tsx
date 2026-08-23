import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StatNode, STAT_PENDING } from "./StatNode.js";

function render(props: Parameters<typeof StatNode>[0]): string {
  return renderToStaticMarkup(<StatNode {...props} />);
}

describe("StatNode renders from props", () => {
  it("renders label, value, and unit", () => {
    const html = render({ label: "cpu", value: "12.5", unit: "%" });
    expect(html).toContain(">cpu<");
    expect(html).toContain("12.5%");
  });

  it("accepts numeric values without inventing units", () => {
    const html = render({ label: "net/min", value: 42 });
    expect(html).toContain(">42<");
  });

  it("renders the pending state, never a fabricated number, when value is null", () => {
    const html = render({ label: "blocked", value: null });
    expect(html).toContain(STAT_PENDING);
    expect(html).toMatch(/data-tone="pending"/);
    expect(html).not.toMatch(/\d/);
  });

  it("marks pending values as not-yet-known for assistive tech via title", () => {
    const html = render({ label: "gpu", value: null });
    expect(html).toContain(`title="gpu: no data yet"`);
  });

  it("applies tone as both class and attribute", () => {
    const html = render({ label: "engine", value: "failed", tone: "error" });
    expect(html).toContain("stat--error");
    expect(html).toMatch(/data-tone="error"/);
  });

  it("applies large size only when asked", () => {
    expect(render({ label: "blocked", value: 7, size: "large" })).toContain(
      "stat--large",
    );
    expect(render({ label: "blocked", value: 7 })).not.toContain(
      "stat--large",
    );
  });

  it("shows detail text only when provided", () => {
    const withDetail = render({
      label: "engine",
      value: "failed",
      detail: "required filter source unavailable",
    });
    expect(withDetail).toContain("required filter source unavailable");
    const withoutDetail = render({ label: "engine", value: "ready" });
    expect(withoutDetail).toContain("stat__value");
    expect(withoutDetail).not.toContain("stat__detail");
  });

  it("threads a testId through for harness queries", () => {
    const html = render({ label: "cpu", value: 3, testId: "cpu" });
    expect(html).toMatch(/data-testid="cpu"/);
  });

  it("treats empty-string detail as absent", () => {
    const html = render({ label: "ram", value: 512, detail: "" });
    expect(html).not.toContain("stat__detail");
  });
});
