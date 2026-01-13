// lib/agent/fallback.ts
import type { KeywordPage } from './clustering';
import type { ClusterResult } from './schema';

/**
 * Build a fallback result with frequency-based top keywords when LLM clustering fails.
 * Returns only topKeywords (no clusters) with keyword frequency counts.
 */
export function buildFallbackResult(pages: KeywordPage[]): ClusterResult {
  if (pages.length === 0) {
    return {
      meta: {
        totalPages: 0,
        clustersFound: 0,
      },
      clusters: [],
      topKeywords: [],
    };
  }

  // Count keyword frequencies
  const keywordCounts = new Map<string, number>();

  for (const page of pages) {
    for (const keyword of page.keywords) {
      // Normalize: trim and lowercase
      const normalized = keyword.trim().toLowerCase();

      // Skip empty keywords
      if (!normalized) continue;

      const count = keywordCounts.get(normalized) || 0;
      keywordCounts.set(normalized, count + 1);
    }
  }

  // Convert to array and sort by count (descending), then alphabetically
  const topKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count; // Descending by count
      }
      return a.keyword.localeCompare(b.keyword); // Alphabetically
    })
    .slice(0, 10); // Limit to top 10

  return {
    meta: {
      totalPages: pages.length,
      clustersFound: 0,
    },
    clusters: [],
    topKeywords,
  };
}
