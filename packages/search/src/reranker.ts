import type { SearchResult } from "@mine/contracts";

export function rerankResults(results: readonly SearchResult[], query: string): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return [...results];

  const scored = results.map((item) => {
    const text = `${item.title} ${item.snippet} ${item.domain}`.toLowerCase();
    let termMatches = 0;
    for (const term of terms) {
      if (text.includes(term)) termMatches += 1;
    }

    const matchRatio = termMatches / terms.length;
    const finalScore = Number((item.score * 0.7 + matchRatio * 0.3).toFixed(4));
    return { ...item, score: finalScore };
  });

  return scored.sort((a, b) => b.score - a.score);
}
