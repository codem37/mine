import { describe, expect, it } from "vitest";
import { isEssentialYouTubeMediaRequest, redactRequestDiagnostic } from "./request-policy.js";

const stream = {
  url: "https://rr2---sn.example.googlevideo.com/videoplayback?expire=secret&sig=token",
  sourceUrl: "https://www.youtube.com/watch?v=example",
  resourceType: "media",
} as const;

describe("essential media compatibility", () => {
  it("allows a YouTube-initiated Googlevideo media stream", () => {
    expect(isEssentialYouTubeMediaRequest(stream)).toBe(true);
  });

  it("does not bypass an unknown initiator, other request types, or an ad host", () => {
    expect(isEssentialYouTubeMediaRequest({ ...stream, sourceUrl: "" })).toBe(false);
    expect(isEssentialYouTubeMediaRequest({ ...stream, sourceUrl: "https://evil.example/" })).toBe(false);
    expect(isEssentialYouTubeMediaRequest({ ...stream, resourceType: "xhr" })).toBe(false);
    expect(isEssentialYouTubeMediaRequest({ ...stream, url: "https://googleads.g.doubleclick.net/videoplayback" })).toBe(false);
  });

  it("redacts signed query strings from diagnostics", () => {
    expect(redactRequestDiagnostic(stream)).toEqual({
      host: "rr2---sn.example.googlevideo.com",
      pathname: "/videoplayback",
      sourceHost: "www.youtube.com",
      resourceType: "media",
    });
  });
});
