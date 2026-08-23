import type { SearchRequest, SearchResponse, SearchResult } from "@mine/contracts";
import { reciprocalRankFusion, type EngineResultList } from "./fusion.js";
import { extractFacets, inferCategory } from "./facets.js";

export class SearchEngine {
  private readonly cache = new Map<string, SearchResponse>();
  private readonly timeoutMs: number;

  constructor(options: { timeoutMs?: number } = {}) {
    this.timeoutMs = options.timeoutMs ?? 3000;
  }

  async search(req: SearchRequest): Promise<SearchResponse> {
    const cacheKey = `${req.query.toLowerCase().trim()}:${req.category ?? "all"}:${req.page ?? 1}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    // Simulated Metasearch Engine Queries (SearXNG aggregator)
    const mockEngineLists: EngineResultList[] = [
      {
        engineName: "google",
        results: [
          {
            id: "res-1",
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(req.query)}`,
            title: `${req.query} - Wikipedia`,
            snippet: `Comprehensive documentation and overview of ${req.query}.`,
            category: "article",
          },
          {
            id: "res-2",
            url: `https://github.com/topics/${encodeURIComponent(req.query)}`,
            title: `GitHub - ${req.query} repositories`,
            snippet: `Open source projects and code repositories related to ${req.query}.`,
            category: "code",
          },
        ],
      },
      {
        engineName: "duckduckgo",
        results: [
          {
            id: "res-3",
            url: `https://github.com/topics/${encodeURIComponent(req.query)}`,
            title: `GitHub - ${req.query} repositories`,
            snippet: `Open source repositories for ${req.query}.`,
            category: "code",
          },
          {
            id: "res-4",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(req.query)}`,
            title: `${req.query} Videos & Tutorials`,
            snippet: `Watch video guides and explanations for ${req.query}.`,
            category: "video",
          },
        ],
      },
    ];

    // Combine via Reciprocal Rank Fusion
    let fused = reciprocalRankFusion(mockEngineLists);

    // Apply category filter if specified
    if (req.category && req.category !== "all") {
      fused = fused.filter((item) => {
        const cat = item.category || inferCategory(item.url, item.title, item.snippet);
        return cat === req.category;
      });
    }

    const facets = extractFacets(fused);
    const duration = Date.now() - startTime;

    const response: SearchResponse = {
      query: req.query,
      results: fused,
      facets,
      totalResults: fused.length,
      timeMs: duration,
    };

    this.cache.set(cacheKey, response);
    return response;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
