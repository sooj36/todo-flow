import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queryProjectPages, getProjectPageContent } from './projects';
import * as notionClient from './client';

describe('projects Notion helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NOTION_PROJECT_DB_ID = process.env.NOTION_PROJECT_DB_ID || 'test-project-db';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries project DB with title contains filter', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      results: [
        {
          id: 'page-1',
          url: 'http://notion.test/page-1',
          properties: {
            '이름': { type: 'title', title: [{ plain_text: '테스트' }] },
            '요약': { type: 'rich_text', rich_text: [{ plain_text: '요약' }] },
          },
        },
      ],
    });

    const mockClient = {
      databases: { query: mockQuery },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const result = await queryProjectPages('  뱅크샐러드 ');

    expect(mockQuery).toHaveBeenCalledWith({
      database_id: process.env.NOTION_PROJECT_DB_ID,
      filter: {
        property: '이름',
        title: { contains: '뱅크샐러드' },
      },
      sorts: [
        { timestamp: 'last_edited_time', direction: 'descending' },
      ],
      page_size: 20,
    });

    expect(result[0]).toMatchObject({
      pageId: 'page-1',
      title: '테스트',
      url: 'http://notion.test/page-1',
      summary: '요약',
    });
  });

  it('throws when env is missing', async () => {
    const original = process.env.NOTION_PROJECT_DB_ID;
    delete process.env.NOTION_PROJECT_DB_ID;

    const mockClient = {
      databases: { query: vi.fn() },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    await expect(queryProjectPages('test')).rejects.toThrow('NOTION_PROJECT_DB_ID environment variable is not set');

    process.env.NOTION_PROJECT_DB_ID = original;
  });

  it('extracts 공고 toggle children text and caches result', async () => {
    const mockList = vi
      .fn()
      // Root blocks
      .mockResolvedValueOnce({
        results: [
          {
            id: 'toggle-1',
            type: 'toggle',
            toggle: {
              rich_text: [{ plain_text: '공고' }],
            },
          },
        ],
      })
      // Toggle children
      .mockResolvedValueOnce({
        results: [
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: '첫 줄' }] },
          },
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: '첫 줄' }] }, // duplicate to be deduped
          },
        ],
      });

    const mockClient = {
      blocks: { children: { list: mockList } },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const page = { pageId: 'page-1', title: '테스트', summary: '' };

    const first = await getProjectPageContent(page);
    expect(first.source).toBe('toggle');
    expect(first.text).toBe('첫 줄');
    expect(mockList).toHaveBeenCalledTimes(2);

    // Cached second call should not call Notion again
    const second = await getProjectPageContent(page);
    expect(second.text).toBe('첫 줄');
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('falls back to 요약 property when no blocks yield text', async () => {
    const mockList = vi.fn().mockResolvedValue({
      results: [
        {
          type: 'paragraph',
          paragraph: { rich_text: [] },
        },
      ],
    });

    const mockClient = {
      blocks: { children: { list: mockList } },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const page = { pageId: 'page-2', title: '테스트', summary: '요약 텍스트' };

    const result = await getProjectPageContent(page);
    expect(result.source).toBe('summary');
    expect(result.text).toBe('요약 텍스트');
  });
});
