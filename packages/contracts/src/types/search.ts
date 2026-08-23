export type SearchMode = "all" | "images" | "videos" | "news" | "shopping" | "academic";

export type SearchResultType = "web" | "image" | "video" | "news" | "product" | "academic";

export interface ProductSpecs {
  readonly brand?: string;
  readonly cpu?: string;
  readonly ram?: string;
  readonly storage?: string;
  readonly gpu?: string;
  readonly display?: string;
  readonly size?: string;
  readonly color?: string;
  readonly material?: string;
}

export interface SearchResult {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly snippet: string;
  readonly engine: string;
  readonly score: number;
  readonly type: SearchResultType;
  readonly domain: string;
  readonly category?: string;
  readonly publishedDate?: string;
  readonly favicon?: string;
  readonly thumbnail?: string;
  readonly sourceCount?: number;
  readonly badges?: readonly string[];
  // Product metadata
  readonly price?: number;
  readonly currency?: string;
  readonly seller?: string;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly availability?: string;
  readonly specs?: ProductSpecs;
  // Academic metadata
  readonly authors?: readonly string[];
  readonly year?: number;
  readonly journal?: string;
  readonly doi?: string;
  readonly citationCount?: number;
  readonly pdfUrl?: string;
  // Video metadata
  readonly durationSeconds?: number;
  readonly resolution?: string;
  readonly mediaStreamUrl?: string;
}

export interface FacetValue {
  readonly label: string;
  readonly count: number;
  readonly value: string;
}

export interface DynamicFacet {
  readonly id: string;
  readonly label: string;
  readonly type: "checkbox" | "range" | "select";
  readonly values: readonly FacetValue[];
  readonly range?: readonly [number, number];
}

export interface SearchFacet {
  readonly name: string;
  readonly count: number;
}

export interface SearchRequest {
  readonly query: string;
  readonly mode?: SearchMode;
  readonly category?: string;
  readonly page?: number;
  readonly appliedFacets?: Record<string, string | readonly string[] | readonly [number, number]>;
  readonly region?: string;
  readonly language?: string;
  readonly safeSearch?: "on" | "moderate" | "off";
  readonly isPrivate?: boolean;
}

export interface SearchDiagnostics {
  readonly sourcesQueried: number;
  readonly sourcesAvailable: number;
  readonly queryVariants: number;
  readonly resultsMerged: number;
  readonly resultsReranked: number;
  readonly cacheStatus: "HIT" | "MISS";
  readonly latencyMs: number;
}

export interface SearchResponse {
  readonly query: string;
  readonly interpretedQuery?: string;
  readonly typoCorrection?: string;
  readonly mode: SearchMode;
  readonly results: readonly SearchResult[];
  readonly facets: readonly DynamicFacet[];
  readonly relatedQueries: readonly string[];
  readonly totalResults: number;
  readonly timeMs: number;
  readonly cacheStatus: "HIT" | "MISS";
  readonly diagnostics: SearchDiagnostics;
}

export type SuggestionCategory = "history" | "bookmark" | "completion" | "contextual";

export interface SuggestionItem {
  readonly id: string;
  readonly text: string;
  readonly url?: string;
  readonly category: SuggestionCategory;
  readonly title?: string;
}

export interface SuggestRequest {
  readonly query: string;
  readonly isPrivate?: boolean;
}

export interface SuggestResponse {
  readonly query: string;
  readonly suggestions: readonly SuggestionItem[];
}
