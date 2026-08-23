import type { SuggestionItem } from "@mine/contracts";

export class SuggestionProvider {
  private readonly history: string[] = [];

  recordSearch(query: string, isPrivate?: boolean): void {
    if (isPrivate) return; // Privacy isolation
    const trimmed = query.trim();
    if (!trimmed) return;
    const idx = this.history.indexOf(trimmed);
    if (idx !== -1) this.history.splice(idx, 1);
    this.history.unshift(trimmed);
    if (this.history.length > 50) this.history.pop();
  }

  getSuggestions(query: string, isPrivate?: boolean): SuggestionItem[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const list: SuggestionItem[] = [];

    // 1. History match (only if non-private)
    if (!isPrivate) {
      for (const h of this.history) {
        if (h.toLowerCase().includes(trimmed)) {
          list.push({
            id: `history-${h}`,
            text: h,
            category: "history",
          });
        }
      }
    }

    // 2. Bookmarks mock/static match
    const bookmarks = [
      { text: "Python Documentation", url: "https://docs.python.org/3/" },
      { text: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/" },
      { text: "React Official Docs", url: "https://react.dev/" },
    ];
    for (const b of bookmarks) {
      if (b.text.toLowerCase().includes(trimmed) || b.url.toLowerCase().includes(trimmed)) {
        list.push({
          id: `bm-${b.url}`,
          text: b.text,
          url: b.url,
          category: "bookmark",
        });
      }
    }

    // 3. Search Completions
    const completions = [
      `${trimmed} tutorial`,
      `${trimmed} documentation`,
      `${trimmed} 2025`,
      `${trimmed} vs javascript`,
    ];
    for (const c of completions) {
      if (!list.some((i) => i.text.toLowerCase() === c.toLowerCase())) {
        list.push({
          id: `comp-${c}`,
          text: c,
          category: "completion",
        });
      }
    }

    return list.slice(0, 8);
  }
}
