// lib/notion/keywords.ts
// Notion keyword pages query and normalization
//
// NOTE: Notion API 'contains' filter case-sensitivity is not documented.
// This implementation uses the original queryText (trimmed only) to match
// user input exactly. Users should match the case of their Notion data.
// See: https://developers.notion.com/reference/post-database-query-filter

import { getNotionClient } from './client';
import { extractTitle } from './parsers';
import type { KeywordPage } from '@/types';

/**
 * Extract keywords from multi_select property
 */
function extractKeywords(property: unknown): string[] {
  if (
    property &&
    typeof property === 'object' &&
    'type' in property &&
    property.type === 'multi_select' &&
    'multi_select' in property &&
    Array.isArray(property.multi_select)
  ) {
    const keywords = property.multi_select
      .map((item) => {
        if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') {
          return item.name.trim();
        }
        return '';
      })
      .filter((keyword) => keyword.length > 0);

    // Remove duplicates
    return Array.from(new Set(keywords));
  }
  return [];
}

/**
 * Get completed keyword extraction pages from Notion
 *
 * This function queries the Notion database for pages with "키워드 추출" checkbox enabled,
 * normalizes the data, and filters out pages with empty keywords.
 *
 * @param queryText - Optional search text to filter by title or keywords (trimmed, case-matching as-is)
 * @returns Array of normalized keyword pages (only pages with at least one keyword)
 *
 * @throws {Error} When no completed pages found (cold start scenario) -
 *                 "완료된 키워드 추출 페이지가 없습니다. Notion에서 최소 3~5개의 페이지에 키워드를 추출해주세요."
 * @throws {Error} When all pages have empty keywords -
 *                 "키워드가 하나도 없습니다. Notion 페이지에 키워드를 추가해주세요."
 * @throws {Error} When NOTION_KEYWORD_DB_ID environment variable is not set
 *
 * @remarks
 * - Pages without any keywords are silently filtered out and logged to console
 * - This is a breaking change from previous behavior (returning empty array)
 * - Callers should handle errors and display appropriate user guidance
 */
export async function getCompletedKeywordPages(queryText?: string): Promise<KeywordPage[]> {
  const notion = getNotionClient();
  const dbId = process.env.NOTION_KEYWORD_DB_ID;

  if (!dbId) {
    throw new Error('NOTION_KEYWORD_DB_ID environment variable is not set');
  }

  // Build filter
  const baseFilter = {
    property: '키워드 추출',
    checkbox: {
      equals: true,
    },
  };

  let filter: unknown = baseFilter;

  // Add queryText filter if provided (trimmed, preserving original case)
  if (queryText && queryText.trim()) {
    const trimmedQuery = queryText.trim();
    filter = {
      and: [
        baseFilter,
        {
          or: [
            {
              property: 'Title',
              title: {
                contains: trimmedQuery,
              },
            },
            {
              property: '키워드',
              multi_select: {
                contains: trimmedQuery,
              },
            },
          ],
        },
      ],
    };
  }

  const response = await notion.databases.query({
    database_id: dbId,
    filter: filter as any,
    sorts: [
      {
        timestamp: 'last_edited_time',
        direction: 'descending',
      },
    ],
    page_size: 20,
  });

  // Check if no completed pages found
  if (response.results.length === 0) {
    throw new Error('완료된 키워드 추출 페이지가 없습니다. Notion에서 최소 3~5개의 페이지에 키워드를 추출해주세요.');
  }

  // Normalize results
  const normalized = response.results.map((page: any) => {
    const title = extractTitle(page.properties['Title']);
    const keywords = extractKeywords(page.properties['키워드']);

    return {
      pageId: page.id,
      title,
      keywords,
    };
  });

  // Filter out pages with no keywords
  const validPages = normalized.filter((page) => page.keywords.length > 0);

  // Log filtered pages for debugging
  const filteredCount = normalized.length - validPages.length;
  if (filteredCount > 0) {
    const filteredTitles = normalized
      .filter((page) => page.keywords.length === 0)
      .map((page) => page.title);
    console.warn(
      `[getCompletedKeywordPages] Filtered out ${filteredCount} page(s) with no keywords: ${filteredTitles.join(', ')}`
    );
  }

  // Check if all pages have no keywords
  if (validPages.length === 0) {
    throw new Error('키워드가 하나도 없습니다. Notion 페이지에 키워드를 추가해주세요.');
  }

  return validPages;
}
