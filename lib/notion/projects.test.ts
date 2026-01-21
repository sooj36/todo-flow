import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getProjectPages, getProjectPageContent } from './projects';
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

    const result = await getProjectPages('  뱅크샐러드 ');

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

    await expect(getProjectPages('test')).rejects.toThrow('NOTION_PROJECT_DB_ID environment variable is not set');

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
        has_more: false,
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
        has_more: false,
      });

    const mockClient = {
      blocks: { children: { list: mockList } },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const page = { pageId: 'page-1', title: '테스트', summary: '' };

    const first = await getProjectPageContent(page);
    expect(first.source).toBe('toggle');
    expect(first.text).toBe('첫 줄');
    expect(first.rawLength).toBe('첫 줄\n첫 줄'.length);
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
      has_more: false,
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

  it('paginates blocks and toggle children to avoid truncation and reports raw length before compression', async () => {
    const mockList = vi
      .fn()
      // Root blocks page 1
      .mockResolvedValueOnce({
        results: [
          {
            id: 'toggle-1',
            type: 'toggle',
            toggle: { rich_text: [{ plain_text: '공고' }] },
          },
        ],
        has_more: true,
        next_cursor: 'root-next',
      })
      // Root blocks page 2
      .mockResolvedValueOnce({
        results: [
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: '루트 마지막' }] },
          },
        ],
        has_more: false,
      })
      // Toggle children page 1
      .mockResolvedValueOnce({
        results: [
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: 'line1' }] },
          },
        ],
        has_more: true,
        next_cursor: 'child-next',
      })
      // Toggle children page 2
      .mockResolvedValueOnce({
        results: [
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: 'line2' }] },
          },
        ],
        has_more: false,
      });

    const mockClient = {
      blocks: { children: { list: mockList } },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const page = { pageId: 'page-3', title: '테스트', summary: '' };

    const result = await getProjectPageContent(page);

    expect(mockList).toHaveBeenCalledTimes(4);
    expect(result.text).toBe('line1\nline2');
    expect(result.rawLength).toBe('line1\nline2'.length);
    // ensure pagination cursors were used
    expect(mockList).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ block_id: 'page-3', start_cursor: 'root-next' })
    );
    expect(mockList).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ block_id: 'toggle-1', start_cursor: 'child-next' })
    );
  });

  it('falls back to page text when 공고 토글이 없고 trims/merges paragraphs', async () => {
    const mockList = vi
      .fn()
      // Root blocks only (no toggle)
      .mockResolvedValueOnce({
        results: [
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: '첫 문장' }] },
          },
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: '두 번째 문장' }] },
          },
        ],
        has_more: false,
      });

    const mockClient = {
      blocks: { children: { list: mockList } },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const page = { pageId: 'page-4', title: '테스트', summary: '' };

    const result = await getProjectPageContent(page);

    expect(result.source).toBe('page');
    expect(result.text).toBe('첫 문장\n두 번째 문장');
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it('throws when no 공고 텍스트 or 요약 is available', async () => {
    const mockList = vi.fn().mockResolvedValue({
      results: [
        {
          type: 'paragraph',
          paragraph: { rich_text: [] },
        },
      ],
      has_more: false,
    });

    const mockClient = {
      blocks: { children: { list: mockList } },
    } as unknown as ReturnType<typeof notionClient.getNotionClient>;

    vi.spyOn(notionClient, 'getNotionClient').mockReturnValue(mockClient);

    const page = { pageId: 'page-5', title: '테스트', summary: '' };

    await expect(getProjectPageContent(page)).rejects.toThrow('공고 내용이 비어있습니다');
  });
});
