import type { SearchDiagnostics, SearchRequest, SearchResponse, SearchResult } from "@mine/contracts";
import { processQuery } from "./query-processor.js";
import { reciprocalRankFusion } from "./fusion.js";
import { rerankResults } from "./reranker.js";
import { inferDynamicFacets } from "./facets.js";
import { SuggestionProvider } from "./suggest.js";

interface CacheEntry {
  readonly timestamp: number;
  readonly response: SearchResponse;
}

export class SearchEngine {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly suggestProvider = new SuggestionProvider();

  getSuggestions(query: string, isPrivate?: boolean) {
    return this.suggestProvider.getSuggestions(query, isPrivate);
  }

  async search(req: SearchRequest): Promise<SearchResponse> {
    const startTime = performance.now();
    const cacheKey = `${req.query.toLowerCase()}:${req.mode || "all"}:${JSON.stringify(req.appliedFacets ?? {})}`;

    // Cache lookup (1 minute TTL)
    const cached = this.cache.get(cacheKey);
    if (cached && performance.now() - cached.timestamp < 60000) {
      return {
        ...cached.response,
        cacheStatus: "HIT",
        diagnostics: {
          ...cached.response.diagnostics,
          cacheStatus: "HIT",
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
        },
      };
    }

    // Process query & intent
    const processed = processQuery(req.query, req.mode);
    const mode = processed.inferredMode;

    // Record search in suggestion provider (respecting private mode)
    this.suggestProvider.recordSearch(processed.query, req.isPrivate);

    // Mock search provider results (SearXNG simulation fallback)
    const rawResults = generateMockResults(processed.query, mode);

    // Multi-engine RRF fusion
    const engineLists = [
      { engineName: "duckduckgo", results: rawResults },
      { engineName: "google", results: rawResults },
      { engineName: "bing", results: rawResults },
    ];
    const fused = reciprocalRankFusion(engineLists);

    // Local semantic re-ranking
    const reranked = rerankResults(fused, processed.query);

    // Dynamic Facet Inference
    const facets = inferDynamicFacets(reranked, mode);

    const timeMs = Number((performance.now() - startTime).toFixed(2));

    const diagnostics: SearchDiagnostics = {
      sourcesQueried: 3,
      sourcesAvailable: 3,
      queryVariants: processed.queryVariants.length,
      resultsMerged: rawResults.length * 3,
      resultsReranked: reranked.length,
      cacheStatus: "MISS",
      latencyMs: timeMs,
    };

    const response: SearchResponse = {
      query: req.query,
      interpretedQuery: processed.query !== req.query ? processed.query : undefined,
      typoCorrection: processed.typoCorrection,
      mode,
      results: reranked,
      facets,
      relatedQueries: [
        `${processed.query} tutorial`,
        `${processed.query} guide 2025`,
        `best ${processed.query} review`,
      ],
      totalResults: reranked.length,
      timeMs,
      cacheStatus: "MISS",
      diagnostics,
    };

    this.cache.set(cacheKey, { timestamp: performance.now(), response });
    return response;
  }
}

function generateMockResults(query: string, mode: string): SearchResult[] {
  const lower = query.toLowerCase();

  if (mode === "shopping") {
    return [
      {
        id: "prod-1",
        url: "https://example-store.com/laptops/lenovo-legion",
        title: "Lenovo Legion 5 Pro Gaming Laptop",
        snippet: "Intel Core i7, 16GB RAM, 512GB SSD, RTX 4060 GPU, 16-inch Display.",
        engine: "google",
        score: 0.95,
        type: "product",
        domain: "example-store.com",
        price: 74999,
        currency: "₹",
        seller: "TechWorld",
        rating: 4.6,
        reviewCount: 128,
        specs: { brand: "Lenovo", cpu: "Intel i7", ram: "16 GB", gpu: "RTX 4060", storage: "512 GB" },
      },
      {
        id: "prod-2",
        url: "https://example-store.com/laptops/asus-tuf",
        title: "ASUS TUF Gaming F15",
        snippet: "AMD Ryzen 7, 16GB RAM, 1TB SSD, RTX 4050 GPU, 15.6-inch Display.",
        engine: "bing",
        score: 0.88,
        type: "product",
        domain: "example-store.com",
        price: 78990,
        currency: "₹",
        seller: "GadgetHub",
        rating: 4.4,
        reviewCount: 94,
        specs: { brand: "ASUS", cpu: "Ryzen 7", ram: "16 GB", gpu: "RTX 4050", storage: "1 TB" },
      },
    ];
  }

  if (mode === "videos") {
    return [
      {
        id: "vid-1",
        url: "https://youtube.com/watch?v=interstellar-trailer",
        title: "Interstellar - Main Trailer [HD]",
        snippet: "Official main trailer for Interstellar directed by Christopher Nolan.",
        engine: "duckduckgo",
        score: 0.98,
        type: "video",
        domain: "youtube.com",
        durationSeconds: 154,
        resolution: "1080p",
        mediaStreamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    ];
  }

  if (mode === "academic") {
    return [
      {
        id: "acad-1",
        url: "https://arxiv.org/abs/2301.00001",
        title: "Deep Long-Tail Learning in Neural Networks: A Comprehensive Survey",
        snippet: "We provide an exhaustive overview of techniques addressing class imbalance in deep learning.",
        engine: "google",
        score: 0.96,
        type: "academic",
        domain: "arxiv.org",
        authors: ["A. Sharma", "B. Zhang", "C. Davis"],
        year: 2025,
        journal: "IEEE Transactions on Pattern Analysis",
        doi: "10.1109/TPAMI.2025.1234567",
        citationCount: 42,
        pdfUrl: "https://arxiv.org/pdf/2301.00001.pdf",
      },
    ];
  }

  return [
    {
      id: "web-1",
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      title: `${query} - Wikipedia`,
      snippet: `Detailed documentation and overview regarding ${query}.`,
      engine: "google",
      score: 0.9,
      type: "web",
      domain: "wikipedia.org",
      favicon: "https://en.wikipedia.org/favicon.ico",
    },
    {
      id: "web-2",
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
      title: `${query} Reference - MDN Web Docs`,
      snippet: `Complete syntax, examples, and API guides for ${query}.`,
      engine: "duckduckgo",
      score: 0.85,
      type: "web",
      domain: "developer.mozilla.org",
    },
  ];
}
