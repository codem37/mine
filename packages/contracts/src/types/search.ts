export interface SearchResult {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly snippet: string;
  readonly engine: string;
  readonly score: number;
  readonly category?: string;
  readonly publishedDate?: string;
}

export interface SearchFacet {
  readonly name: string;
  readonly count: number;
}

export interface SearchRequest {
  readonly query: string;
  readonly category?: string;
  readonly page?: number;
}

export interface SearchResponse {
  readonly query: string;
  readonly results: readonly SearchResult[];
  readonly facets: readonly SearchFacet[];
  readonly totalResults: number;
  readonly timeMs: number;
}
