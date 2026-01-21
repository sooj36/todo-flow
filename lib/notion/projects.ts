// lib/notion/projects.ts
// Notion Project DB query and content extraction (공고 토글 우선)

import { getNotionClient } from './client';
import { extractRichText, extractTitle } from './parsers';

export interface ProjectPage {
  pageId: string;
  title: string;
  url?: string;
  summary?: string;
}

export type ContentSource = 'toggle' | 'page' | 'summary';

interface ExtractedContent {
  text: string;
  source: ContentSource;
  rawLength: number;
}

const contentCache = new Map<string, ExtractedContent>();
const MAX_CHARS = 4000;

/**
 * Query Project DB pages by title (contains match, trimmed).
 */
export async function getProjectPages(queryText: string): Promise<ProjectPage[]> {
  const notion = getNotionClient();
  const dbId = process.env.NOTION_PROJECT_DB_ID;

  if (!dbId) {
    throw new Error('NOTION_PROJECT_DB_ID environment variable is not set');
  }

  const trimmed = queryText.trim();
  if (!trimmed) {
    throw new Error('검색어가 비어있습니다');
  }

  const response = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: '이름',
      title: {
        contains: trimmed,
      },
    } as any,
    sorts: [
      {
        timestamp: 'last_edited_time',
        direction: 'descending',
      },
    ],
    page_size: 20,
  });

  if (response.results.length === 0) {
    throw new Error('프로젝트 DB에 일치하는 페이지가 없습니다');
  }

  return response.results.map((page: any) => {
    const title = extractTitle(page.properties['이름']);
    const summary = extractRichText(page.properties['요약'], '').trim();

    return {
      pageId: page.id,
      title,
      url: page.url,
      summary: summary || undefined,
    };
  });
}

// Backward compatibility alias.
export const queryProjectPages = getProjectPages;

/**
 * Get cached/plaintext content for a project page.
 * Prefers 공고 토글 children, falls back to page-level text, then 요약 필드.
 */
export async function getProjectPageContent(page: ProjectPage): Promise<ExtractedContent> {
  const cached = contentCache.get(page.pageId);
  if (cached) {
    return cached;
  }

  const notion = getNotionClient();

  // Fetch top-level blocks
  const rootBlocks = await fetchAllBlocks(notion, page.pageId, 100);

  // Try 공고 toggle first
  const toggleBlock = rootBlocks.find(
    (block: any) =>
      block.type === 'toggle' &&
      block.toggle &&
      Array.isArray(block.toggle.rich_text) &&
      block.toggle.rich_text.some((r: any) => (r.plain_text || '').includes('공고'))
  );

  if (toggleBlock) {
    const toggleChildren = await fetchAllBlocks(notion, (toggleBlock as any).id, 100);
    const toggleLines = collectPlainText(toggleChildren);
    const toggleText = compressText(toggleLines);
    const rawLength = computeRawLength(toggleLines);
    if (toggleText) {
      const result: ExtractedContent = {
        text: toggleText,
        source: 'toggle',
        rawLength,
      };
      contentCache.set(page.pageId, result);
      return result;
    }
  }

  // Fallback: entire page text
  const pageLines = collectPlainText(rootBlocks);
  const pageText = compressText(pageLines);
  const rawLength = computeRawLength(pageLines);
  if (pageText) {
    const result: ExtractedContent = {
      text: pageText,
      source: 'page',
      rawLength,
    };
    contentCache.set(page.pageId, result);
    return result;
  }

  // Fallback: 요약 property
  if (page.summary) {
    const trimmed = page.summary.trim();
    if (trimmed) {
      const clipped = trimmed.slice(0, MAX_CHARS);
      const result: ExtractedContent = {
        text: clipped,
        source: 'summary',
        rawLength: trimmed.length,
      };
      contentCache.set(page.pageId, result);
      return result;
    }
  }

  throw new Error('공고 내용이 비어있습니다');
}

/**
 * Collect plain text from a list of blocks (paragraphs, list items, headings, callouts).
 * Non-textual blocks (pdf/link_preview etc.) are skipped.
 */
function collectPlainText(blocks: any[]): string[] {
  const lines: string[] = [];

  for (const block of blocks) {
    if (!block || !block.type) continue;

    const type = block.type;
    const payload = (block as any)[type];

    if (!payload) continue;

    if (payload.rich_text && Array.isArray(payload.rich_text)) {
      const text = payload.rich_text.map((r: any) => r.plain_text || '').join('').trim();
      if (text) {
        lines.push(text);
        lines.push('');
      }
    }
  }

  return lines;
}

/**
 * Deduplicate/trim lines and cut to max length.
 */
function compressText(lines: string[]): string {
  const normalized = normalizeLines(lines);
  if (normalized.length === 0) return '';

  const joined = normalized.join('\n').trim();
  if (joined.length <= MAX_CHARS) return joined;
  return joined.slice(0, MAX_CHARS);
}

/**
 * Calculate raw length before deduplication/truncation.
 */
function computeRawLength(lines: string[]): number {
  if (lines.length === 0) return 0;
  return lines.map((line) => line.trim()).filter(Boolean).join('\n').length;
}

/**
 * Merge consecutive paragraphs, trim, dedupe, and drop empty lines.
 */
function normalizeLines(lines: string[]): string[] {
  const merged: string[] = [];
  let buffer: string[] = [];
  const seenRaw = new Set<string>();

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join(' ').trim();
    if (text) {
      merged.push(text);
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (seenRaw.has(trimmed)) {
      continue;
    }
    seenRaw.add(trimmed);
    buffer.push(trimmed);
  }
  flush();

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const line of merged) {
    if (seen.has(line)) continue;
    seen.add(line);
    deduped.push(line);
  }

  return deduped;
}

/**
 * Paginate through all children blocks for a given block id.
 */
async function fetchAllBlocks(
  notion: ReturnType<typeof getNotionClient>,
  blockId: string,
  pageSize: number
): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const page = await notion.blocks.children.list({
      block_id: blockId,
      page_size: pageSize,
      start_cursor: cursor,
    });

    results.push(...page.results);
    cursor = page.has_more ? page.next_cursor ?? undefined : undefined;
  } while (cursor);

  return results;
}
