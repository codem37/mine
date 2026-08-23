import type { SearchMode } from "@mine/contracts";

const TYPO_MAP: Record<string, string> = {
  "machien lerning": "machine learning",
  "python tutrial": "python tutorial",
  "interstelar": "interstellar",
  "smartfone": "smartphone",
  "laptop": "laptop",
};

export interface ProcessedQuery {
  readonly originalQuery: string;
  readonly query: string;
  readonly typoCorrection?: string;
  readonly inferredMode: SearchMode;
  readonly queryVariants: readonly string[];
}

export function processQuery(rawQuery: string, explicitMode?: SearchMode): ProcessedQuery {
  const trimmed = rawQuery.trim();
  const lower = trimmed.toLowerCase();

  // Typo correction
  let typoCorrection: string | undefined = undefined;
  let query = trimmed;
  if (TYPO_MAP[lower]) {
    typoCorrection = TYPO_MAP[lower];
    query = TYPO_MAP[lower]!;
  }

  // Intent classification
  let inferredMode: SearchMode = explicitMode || "all";
  if (!explicitMode || explicitMode === "all") {
    if (lower.includes("under ₹") || lower.includes("price") || lower.includes("buy") || lower.includes("laptop") || lower.includes("shoes")) {
      inferredMode = "shopping";
    } else if (lower.includes("trailer") || lower.includes("video") || lower.includes("watch") || lower.includes("song")) {
      inferredMode = "videos";
    } else if (lower.includes("paper") || lower.includes("doi") || lower.includes("neural networks") || lower.includes("journal") || lower.includes("author")) {
      inferredMode = "academic";
    } else if (lower.includes("news") || lower.includes("2025") || lower.includes("gdp") || lower.includes("today")) {
      inferredMode = "news";
    }
  }

  // Query expansion (4 variants)
  const variants = [
    query,
    `${query} official`,
    `${query} guide`,
    `${query} 2025`,
  ];

  return {
    originalQuery: trimmed,
    query,
    typoCorrection,
    inferredMode,
    queryVariants: variants,
  };
}
