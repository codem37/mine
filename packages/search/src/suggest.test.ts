import { describe, expect, it } from "vitest";
import { SuggestionProvider } from "./suggest.js";

describe("SuggestionProvider", () => {
  it("provides categorized suggestions (history, bookmark, completion)", () => {
    const provider = new SuggestionProvider();
    provider.recordSearch("python tutorial");

    const suggestions = provider.getSuggestions("python");
    expect(suggestions.length).toBeGreaterThan(0);

    const historyItem = suggestions.find((s) => s.category === "history");
    expect(historyItem?.text).toBe("python tutorial");

    const bookmarkItem = suggestions.find((s) => s.category === "bookmark");
    expect(bookmarkItem).toBeDefined();

    const completionItem = suggestions.find((s) => s.category === "completion");
    expect(completionItem).toBeDefined();
  });

  it("respects private mode isolation and does not record search history when isPrivate is true", () => {
    const provider = new SuggestionProvider();
    provider.recordSearch("secret query", true);

    const suggestions = provider.getSuggestions("secret", false);
    const historyItem = suggestions.find((s) => s.category === "history");
    expect(historyItem).toBeUndefined();
  });
});
