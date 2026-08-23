import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ProtocolInfoPayload } from "@mine/contracts";
import { ProtocolIndicator } from "./ProtocolIndicator.js";
import { ProtocolInfoModal } from "./ProtocolInfoModal.js";

describe("ProtocolIndicator component", () => {
  it("renders ENS badge for .eth domains", () => {
    const html = renderToStaticMarkup(
      <ProtocolIndicator protocol="ens" label="vitalik.eth" onClick={() => {}} />
    );
    expect(html).toContain("ENS");
    expect(html).toContain("vitalik.eth");
  });

  it("renders IPFS badge for ipfs:// URIs", () => {
    const html = renderToStaticMarkup(
      <ProtocolIndicator protocol="ipfs" label="ipfs://bafy..." onClick={() => {}} />
    );
    expect(html).toContain("IPFS");
    expect(html).toContain("ipfs://bafy...");
  });
});

describe("ProtocolInfoModal component", () => {
  it("renders ENS protocol info modal with resolved address and content", () => {
    const payload: ProtocolInfoPayload = {
      protocol: "ens",
      ens: {
        name: "vitalik.eth",
        address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        contentTarget: "ipfs://bafybeicn7e3v2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z",
        status: "resolved",
      },
    };
    const html = renderToStaticMarkup(
      <ProtocolInfoModal payload={payload} onClose={() => {}} onOpenStorage={() => {}} />
    );
    expect(html).toContain("Protocol Information");
    expect(html).toContain("vitalik.eth");
    expect(html).toContain("Copy ENS");
  });
});
