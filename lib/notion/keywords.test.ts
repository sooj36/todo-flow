// lib/notion/keywords.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCompletedKeywordPages } from './keywords';
import * as notionClient from './client';

describe('getCompletedKeywordPages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query Notion with correct filter for completed keyword extraction', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      results: [
        {
          id: 'page-1',
          properties: {
            'Title': {
              type: 'title',
              title: [{ plain_text: 'Test Page 1' }],
            },
            '키워드': {
              type: 'multi_select',
              multi_select: [
                { name: 'keyword1' },
                { name: 'keyword2' },
              ],
            },
          },
        },
      ],
    });

    const mockClient = {
      databases: {
        query: mockQuery,
      },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    await getCompletedKeywordPages();

    expect(mockQuery).toHaveBeenCalledWith({
      database_id: process.env.NOTION_KEYWORD_DB_ID,
      filter: {
        property: '키워드 추출',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
      page_size: 20,
    });
  });

  it('should normalize keyword page data correctly', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      results: [
        {
          id: 'page-1',
          properties: {
            'Title': {
              type: 'title',
              title: [{ plain_text: 'Test Page' }],
            },
            '키워드': {
              type: 'multi_select',
              multi_select: [
                { name: '  keyword1  ' },
                { name: 'keyword2' },
                { name: 'keyword1' }, // duplicate
                { name: '' }, // empty
                { name: '  ' }, // whitespace only
              ],
            },
          },
        },
      ],
    });

    const mockClient = {
      databases: {
        query: mockQuery,
      },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const result = await getCompletedKeywordPages();

    expect(result).toEqual([
      {
        pageId: 'page-1',
        title: 'Test Page',
        keywords: ['keyword1', 'keyword2'], // trimmed, deduplicated, empty removed
      },
    ]);
  });

  it('should filter by queryText in title and keywords (trimmed)', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      results: [
        {
          id: 'page-1',
          properties: {
            'Title': {
              type: 'title',
              title: [{ plain_text: 'Interview Preparation' }],
            },
            '키워드': {
              type: 'multi_select',
              multi_select: [{ name: 'Interview' }],
            },
          },
        },
      ],
    });

    const mockClient = {
      databases: {
        query: mockQuery,
      },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    await getCompletedKeywordPages('  Interview  ');

    expect(mockQuery).toHaveBeenCalledWith({
      database_id: process.env.NOTION_KEYWORD_DB_ID,
      filter: {
        and: [
          {
            property: '키워드 추출',
            checkbox: {
              equals: true,
            },
          },
          {
            or: [
              {
                property: 'Title',
                title: {
                  contains: 'Interview',
                },
              },
              {
                property: '키워드',
                multi_select: {
                  contains: 'Interview',
                },
              },
            ],
          },
        ],
      },
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
      page_size: 20,
    });
  });

  it('should return empty array when no completed pages found', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      results: [],
    });

    const mockClient = {
      databases: {
        query: mockQuery,
      },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const result = await getCompletedKeywordPages();

    expect(result).toEqual([]);
  });

  it('should handle pages with empty keywords array', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      results: [
        {
          id: 'page-1',
          properties: {
            'Title': {
              type: 'title',
              title: [{ plain_text: 'Page with no keywords' }],
            },
            '키워드': {
              type: 'multi_select',
              multi_select: [],
            },
          },
        },
      ],
    });

    const mockClient = {
      databases: {
        query: mockQuery,
      },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const result = await getCompletedKeywordPages();

    expect(result).toEqual([
      {
        pageId: 'page-1',
        title: 'Page with no keywords',
        keywords: [],
      },
    ]);
  });

  it('should throw error when NOTION_KEYWORD_DB_ID is not set', async () => {
    const originalDbId = process.env.NOTION_KEYWORD_DB_ID;
    delete process.env.NOTION_KEYWORD_DB_ID;

    const mockClient = {
      databases: {
        query: vi.fn(),
      },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    await expect(getCompletedKeywordPages()).rejects.toThrow(
      'NOTION_KEYWORD_DB_ID environment variable is not set'
    );

    // Restore original value
    process.env.NOTION_KEYWORD_DB_ID = originalDbId;
  });
});
