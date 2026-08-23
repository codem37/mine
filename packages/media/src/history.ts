import type { MediaHistoryItem, MediaSource } from "@mine/contracts";

export class MediaHistoryStore {
  private history: MediaHistoryItem[] = [];
  private readonly maxItems = 50;

  add(source: MediaSource, pageDomain?: string): MediaHistoryItem {
    // Redact query strings or auth headers from URLs
    let cleanUrl = source.url;
    try {
      const parsed = new URL(source.url);
      parsed.search = "";
      cleanUrl = parsed.toString();
    } catch {
      // keep fallback
    }

    const domain = pageDomain || safeExtractDomain(source.url);

    const item: MediaHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: source.title || "Media File",
      domain,
      url: cleanUrl,
      timestamp: Date.now(),
    };

    // Deduplicate by URL
    this.history = this.history.filter((h) => h.url !== cleanUrl);
    this.history.unshift(item);

    if (this.history.length > this.maxItems) {
      this.history = this.history.slice(0, this.maxItems);
    }

    return item;
  }

  getHistory(): readonly MediaHistoryItem[] {
    return this.history;
  }

  clear(): void {
    this.history = [];
  }
}

function safeExtractDomain(urlString: string): string {
  try {
    return new URL(urlString).hostname;
  } catch {
    return "local";
  }
}
