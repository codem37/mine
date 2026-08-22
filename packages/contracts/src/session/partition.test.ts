import { describe, expect, it } from "vitest";
import { SITE_PARTITION_PREFIX, buildSitePartition } from "./partition.js";

describe("buildSitePartition", () => {
  it("prefixes a plain host", () => {
    expect(buildSitePartition("example.com")).toEqual({
      ok: true,
      value: "persist:site-example.com",
    });
  });

  it("lowercases and trims the host so one site always maps to one partition", () => {
    const a = buildSitePartition("EXAMPLE.com");
    const b = buildSitePartition("  example.COM  ");
    if (a.ok && b.ok) {
      expect(a.value).toBe(b.value);
    } else {
      expect.unreachable("both hosts are valid");
    }
  });

  it("strips the port from a host:port pair", () => {
    const r = buildSitePartition("localhost:5173");
    if (r.ok) {
      expect(r.value).toBe("persist:site-localhost");
    } else {
      expect.unreachable("host is valid");
    }
  });

  it("keeps bracketed IPv6 literals intact", () => {
    const r = buildSitePartition("[::1]:443");
    if (r.ok) {
      expect(r.value).toBe("persist:site-::1");
    } else {
      expect.unreachable("bracketed ipv6 is valid");
    }
  });

  it("rejects an empty host with an invalid-input error", () => {
    const r = buildSitePartition("   ");
    if (!r.ok) {
      expect(r.error.kind).toBe("invalid-input");
    } else {
      expect.unreachable("empty host must not produce a partition");
    }
  });

  it("always produces names under the declared prefix", () => {
    const r = buildSitePartition("example.org");
    if (r.ok) {
      expect(r.value.startsWith(SITE_PARTITION_PREFIX)).toBe(true);
    } else {
      expect.unreachable("host is valid");
    }
  });
});
