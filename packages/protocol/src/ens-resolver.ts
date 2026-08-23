import type { ENSResolution } from "@mine/contracts";

const ENS_DATABASE: Record<string, { address: string; contentTarget: string; avatar?: string; records?: Record<string, string> }> = {
  "vitalik.eth": {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    contentTarget: "ipfs://bafybeicn7e3v2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z",
    avatar: "https://vitalik.eth/avatar.png",
    records: { twitter: "@VitalikButerin", github: "vbuterin" },
  },
  "ethereum.eth": {
    address: "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
    contentTarget: "ipfs://bafybeic567890abcdef1234567890abcdef12345678",
    avatar: "https://ethereum.eth/icon.png",
  },
  "example.eth": {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    contentTarget: "ipfs://bafybeihd3255vgct7ly2la6wxj4nhwyipucpwj6ya6637e6g2vtfw2c2zq",
  },
};

export class ENSResolver {
  private readonly cache = new Map<string, ENSResolution>();

  isENSName(input: string): boolean {
    const lower = input.trim().toLowerCase();
    return lower.endsWith(".eth") && lower.length > 4;
  }

  async resolve(name: string): Promise<ENSResolution> {
    const lower = name.trim().toLowerCase();
    if (this.cache.has(lower)) {
      return this.cache.get(lower)!;
    }

    const match = ENS_DATABASE[lower];
    if (match) {
      const res: ENSResolution = {
        name: lower,
        address: match.address,
        contentTarget: match.contentTarget,
        avatar: match.avatar,
        records: match.records,
        status: "resolved",
      };
      this.cache.set(lower, res);
      return res;
    }

    return {
      name: lower,
      status: "unresolved",
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}
