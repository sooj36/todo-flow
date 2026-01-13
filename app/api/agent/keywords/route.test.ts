// app/api/agent/keywords/route.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from './route';
import * as notionKeywords from '@/lib/notion/keywords';
import * as clustering from '@/lib/agent/clustering';

describe('POST /api/agent/keywords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse queryText from request body', async () => {
    const mockPages = [
      { pageId: 'page-1', title: 'Test', keywords: ['test'] },
    ];
    const mockResult = {
      meta: { totalPages: 1, clustersFound: 0 },
      clusters: [],
      topKeywords: [{ keyword: 'test', count: 1 }],
    };

    vi.spyOn(notionKeywords, 'getCompletedKeywordPages').mockResolvedValue(mockPages);
    vi.spyOn(clustering, 'clusterKeywords').mockResolvedValue(mockResult);

    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queryText: 'test query' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(notionKeywords.getCompletedKeywordPages).toHaveBeenCalledWith('test query');
  });

  it('should use empty string as default when queryText is not provided', async () => {
    const mockPages = [
      { pageId: 'page-1', title: 'Test', keywords: ['test'] },
    ];
    const mockResult = {
      meta: { totalPages: 1, clustersFound: 0 },
      clusters: [],
      topKeywords: [{ keyword: 'test', count: 1 }],
    };

    vi.spyOn(notionKeywords, 'getCompletedKeywordPages').mockResolvedValue(mockPages);
    vi.spyOn(clustering, 'clusterKeywords').mockResolvedValue(mockResult);

    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(notionKeywords.getCompletedKeywordPages).toHaveBeenCalledWith('');
  });

  it('should handle missing request body', async () => {
    const mockPages = [
      { pageId: 'page-1', title: 'Test', keywords: ['test'] },
    ];
    const mockResult = {
      meta: { totalPages: 1, clustersFound: 0 },
      clusters: [],
      topKeywords: [{ keyword: 'test', count: 1 }],
    };

    vi.spyOn(notionKeywords, 'getCompletedKeywordPages').mockResolvedValue(mockPages);
    vi.spyOn(clustering, 'clusterKeywords').mockResolvedValue(mockResult);

    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(notionKeywords.getCompletedKeywordPages).toHaveBeenCalledWith('');
  });

  it('should return 400 on malformed JSON', async () => {
    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should retry once when Gemini clustering fails', async () => {
    const mockPages = [
      {
        pageId: 'page-1',
        title: 'Test Page',
        keywords: ['react', 'typescript'],
      },
    ];

    // Mock Notion query to succeed
    vi.spyOn(notionKeywords, 'getCompletedKeywordPages').mockResolvedValue(mockPages);

    // Mock clustering to fail first, then succeed
    const mockClusterResult = {
      meta: { totalPages: 1, clustersFound: 1 },
      clusters: [{ name: 'Test', keywords: ['react'], pageRefs: ['page-1'] }],
      topKeywords: [{ keyword: 'react', count: 2 }],
    };

    const clusterKeywordsSpy = vi
      .spyOn(clustering, 'clusterKeywords')
      .mockRejectedValueOnce(new Error('Gemini API error'))
      .mockResolvedValueOnce(mockClusterResult);

    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryText: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(clusterKeywordsSpy).toHaveBeenCalledTimes(2); // Initial + 1 retry
    expect(data.clusters).toHaveLength(1);
  });

  it('should return topKeywords fallback after 2 clustering failures', async () => {
    const mockPages = [
      {
        pageId: 'page-1',
        title: 'React Guide',
        keywords: ['react', 'hooks', 'typescript'],
      },
      {
        pageId: 'page-2',
        title: 'Vue Guide',
        keywords: ['vue', 'typescript'],
      },
    ];

    // Mock Notion query to succeed
    vi.spyOn(notionKeywords, 'getCompletedKeywordPages').mockResolvedValue(mockPages);

    // Mock clustering to fail twice
    const clusterKeywordsSpy = vi
      .spyOn(clustering, 'clusterKeywords')
      .mockRejectedValue(new Error('Gemini API error'));

    const request = new Request('http://localhost:3000/api/agent/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryText: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(clusterKeywordsSpy).toHaveBeenCalledTimes(2); // Initial + 1 retry
    expect(data.meta.clustersFound).toBe(0);
    expect(data.clusters).toEqual([]);
    expect(data.topKeywords.length).toBeGreaterThan(0);
    // Verify fallback result has frequency-based topKeywords
    expect(data.topKeywords[0]).toHaveProperty('keyword');
    expect(data.topKeywords[0]).toHaveProperty('count');
  });
});
