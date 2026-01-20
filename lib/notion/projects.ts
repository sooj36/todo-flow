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
export async function queryProjectPages(queryText: string): Promise<ProjectPage[]> {
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
  const root = await notion.blocks.children.list({
    block_id: page.pageId,
    page_size: 100,
  });

  // Try 공고 toggle first
  const toggleBlock = root.results.find(
    (block: any) =>
      block.type === 'toggle' &&
      block.toggle &&
      Array.isArray(block.toggle.rich_text) &&
      block.toggle.rich_text.some((r: any) => (r.plain_text || '').includes('공고'))
  );

  if (toggleBlock) {
    const toggleChildren = await notion.blocks.children.list({
      block_id: (toggleBlock as any).id,
      page_size: 200,
    });

    const toggleText = compressText(collectPlainText(toggleChildren.results));
    if (toggleText) {
      const result: ExtractedContent = {
        text: toggleText,
        source: 'toggle',
        rawLength: toggleText.length,
      };
      contentCache.set(page.pageId, result);
      return result;
    }
  }

  // Fallback: entire page text
  const pageText = compressText(collectPlainText(root.results));
  if (pageText) {
    const result: ExtractedContent = {
      text: pageText,
      source: 'page',
      rawLength: pageText.length,
    };
    contentCache.set(page.pageId, result);
    return result;
  }

  // Fallback: 요약 property
  if (page.summary) {
    const trimmed = page.summary.trim().slice(0, MAX_CHARS);
    if (trimmed) {
      const result: ExtractedContent = {
        text: trimmed,
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
      }
    }
  }

  return lines;
}

/**
 * Deduplicate/trim lines and cut to max length.
 */
function compressText(lines: string[]): string {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    deduped.push(trimmed);
  }

  if (deduped.length === 0) return '';

  const joined = deduped.join('\n');
  if (joined.length <= MAX_CHARS) return joined;
  return joined.slice(0, MAX_CHARS);
}
