import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parsePayload } from "./ipc-parse.js";

const Thing = z.object({ name: z.string().min(1) }).describe("Thing");

describe("parsePayload", () => {
  it("returns the parsed value on ok", () => {
    const r = parsePayload(Thing, { name: "tab" });
    if (r.ok) {
      expect(r.value.name).toBe("tab");
    } else {
      expect.unreachable("valid payload must parse");
    }
  });

  it("returns an invalid-input AppError naming the failing field", () => {
    const r = parsePayload(Thing, { name: "" });
    if (!r.ok) {
      expect(r.error.kind).toBe("invalid-input");
      expect(r.error.message).toContain("name");
    } else {
      expect.unreachable("invalid payload must not parse");
    }
  });

  it("rejects non-object payloads without throwing", () => {
    expect(parsePayload(Thing, 42).ok).toBe(false);
    expect(parsePayload(Thing, null).ok).toBe(false);
  });
});
