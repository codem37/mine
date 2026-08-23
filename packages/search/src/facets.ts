import type { SearchFacet, SearchResult } from "@mine/contracts";

export function inferCategory(url: string, title: string, snippet: string): string {
  const text = `${url} ${title} ${snippet}`.toLowerCase();

  if (url.includes("github.com") || url.includes("gitlab.com") || text.includes("repository") || text.includes("source code")) {
    return "code";
  }
  if (url.includes("youtube.com") || url.includes("vimeo.com") || text.includes("video") || text.includes("watch")) {
    return "video";
  }
  if (url.includes("amazon.") || url.includes("ebay.") || text.includes("price") || text.includes("buy")) {
    return "shopping";
  }
  if (text.includes("documentation") || text.includes("api reference") || url.includes("/docs/")) {
    return "docs";
  }
  if (url.includes("wikipedia.org") || text.includes("article") || text.includes("journal")) {
    return "article";
  }

  return "general";
}

export function extractFacets(results: readonly SearchResult[]): SearchFacet[] {
  const counts = new Map<string, number>();

  for (const item of results) {
    const cat = item.category || inferCategory(item.url, item.title, item.snippet);
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
