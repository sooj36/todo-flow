// lib/agent/clustering.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clusterKeywords } from './clustering';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigError } from './errors';

// Mock the entire module
vi.mock('@google/generative-ai');

describe('clusterKeywords', () => {
  const originalEnv = process.env;

  const mockPages = [
    {
      pageId: 'page-1',
      title: 'React Hooks Guide',
      keywords: ['react', 'hooks', 'useState', 'useEffect'],
    },
    {
      pageId: 'page-2',
      title: 'Vue Composition API',
      keywords: ['vue', 'composition', 'reactive', 'ref'],
    },
    {
      pageId: 'page-3',
      title: 'React Context',
      keywords: ['react', 'context', 'provider', 'consumer'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return cluster JSON output from Gemini', async () => {
    const mockResponse = {
      meta: {
        totalPages: 3,
        clustersFound: 2,
      },
      clusters: [
        {
          name: 'React Development',
          keywords: ['react', 'hooks', 'context'],
          pageRefs: ['page-1', 'page-3'],
        },
        {
          name: 'Vue Development',
          keywords: ['vue', 'composition'],
          pageRefs: ['page-2'],
        },
      ],
      topKeywords: [
        { keyword: 'react', count: 3 },
        { keyword: 'hooks', count: 1 },
      ],
    };

    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockResponse),
      },
    });

    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation((function(this: any) {
      this.getGenerativeModel = mockGetGenerativeModel;
    }) as any);

    const result = await clusterKeywords(mockPages);

    expect(result).toBeDefined();
    expect(result.meta.totalPages).toBe(3);
    expect(result.clusters).toHaveLength(2);
    expect(result.clusters[0].pageRefs).toContain('page-1');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should use structured output with JSON mode', async () => {
    const mockResponse = {
      meta: { totalPages: 0, clustersFound: 0 },
      clusters: [],
      topKeywords: [],
    };

    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockResponse),
      },
    });

    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation((function(this: any) {
      this.getGenerativeModel = mockGetGenerativeModel;
    }) as any);

    await clusterKeywords(mockPages);

    // Verify model was created with JSON response MIME type
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        generationConfig: expect.objectContaining({
          responseMimeType: 'application/json',
        }),
      })
    );
  });

  it('should throw error if Gemini API fails', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));

    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation((function(this: any) {
      this.getGenerativeModel = mockGetGenerativeModel;
    }) as any);

    await expect(clusterKeywords(mockPages)).rejects.toThrow('API Error');
  });

  it('should throw ConfigError when GEMINI_API_KEY is missing', async () => {
    // Remove API key from environment
    delete process.env.GEMINI_API_KEY;

    await expect(clusterKeywords(mockPages)).rejects.toThrow(ConfigError);
    await expect(clusterKeywords(mockPages)).rejects.toThrow('GEMINI_API_KEY is not configured');
  });

  it('should ensure each cluster has at least 1 pageRef', async () => {
    const mockResponse = {
      meta: {
        totalPages: 3,
        clustersFound: 3,
      },
      clusters: [
        {
          name: 'React Development',
          keywords: ['react', 'hooks'],
          pageRefs: ['page-1', 'page-3'],
        },
        {
          name: 'Vue Development',
          keywords: ['vue'],
          pageRefs: ['page-2'],
        },
        {
          name: 'Testing',
          keywords: ['vitest'],
          pageRefs: ['page-1'],
        },
      ],
      topKeywords: [{ keyword: 'react', count: 2 }],
    };

    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockResponse),
      },
    });

    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation((function(this: any) {
      this.getGenerativeModel = mockGetGenerativeModel;
    }) as any);

    const result = await clusterKeywords(mockPages);

    // Verify each cluster has at least 1 pageRef
    result.clusters.forEach((cluster) => {
      expect(cluster.pageRefs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should reject cluster with empty pageRefs via schema validation', async () => {
    const invalidResponse = {
      meta: {
        totalPages: 3,
        clustersFound: 1,
      },
      clusters: [
        {
          name: 'Empty Cluster',
          keywords: ['test'],
          pageRefs: [], // Invalid: empty pageRefs
        },
      ],
      topKeywords: [],
    };

    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(invalidResponse),
      },
    });

    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation((function(this: any) {
      this.getGenerativeModel = mockGetGenerativeModel;
    }) as any);

    // Should throw ZodError due to empty pageRefs
    await expect(clusterKeywords(mockPages)).rejects.toThrow();
  });
});
