import type { SearchResult } from "@mine/contracts";

export interface EngineResultList {
  readonly engineName: string;
  readonly results: readonly SearchResult[];
}

export function reciprocalRankFusion(
  engineLists: readonly EngineResultList[],
  k = 60,
): SearchResult[] {
  const scoreMap = new Map<string, { result: SearchResult; score: number; engines: Set<string> }>();

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
    sourceCount: engines.size,
  }));

  merged.sort((a, b) => b.score - a.score);

  // Balance domain diversity: max 3 results per domain
  const domainCounts = new Map<string, number>();
  const diverse: SearchResult[] = [];

  for (const item of merged) {
    const domain = item.domain || extractDomain(item.url);
    const count = domainCounts.get(domain) ?? 0;
    if (count < 3) {
      domainCounts.set(domain, count + 1);
      diverse.push({ ...item, domain });
    }
  }

  return diverse;
}

function extractDomain(urlString: string): string {
  try {
    return new URL(urlString).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}
