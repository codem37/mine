import type { SearchResult } from "@mine/contracts";

export interface EngineResultList {
  readonly engineName: string;
  readonly results: readonly Omit<SearchResult, "score" | "engine">[];
}

export function reciprocalRankFusion(
  engineLists: readonly EngineResultList[],
  k = 60,
): SearchResult[] {
  const scoreMap = new Map<string, { result: Omit<SearchResult, "score" | "engine">; score: number; engines: Set<string> }>();

  for (const list of engineLists) {
    list.results.forEach((item, index) => {
      const rank = index + 1;
      const rrfScore = 1 / (k + rank);

      const existing = scoreMap.get(item.url);
      if (existing) {
        existing.score += rrfScore;
        existing.engines.add(list.engineName);
      } else {
        scoreMap.set(item.url, {
          result: item,
          score: rrfScore,
          engines: new Set([list.engineName]),
        });
      }
    });
  }

  const merged: SearchResult[] = Array.from(scoreMap.values()).map(({ result, score, engines }) => ({
    ...result,
    score: Number(score.toFixed(4)),
    engine: Array.from(engines).join(", "),
  }));

  return merged.sort((a, b) => b.score - a.score);
}
