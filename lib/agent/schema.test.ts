// lib/agent/schema.test.ts
import { describe, it, expect } from 'vitest';
import { ClusterResultSchema } from './schema';
import type { ClusterResult } from './clustering';

describe('ClusterResultSchema', () => {
  it('should parse valid cluster result', () => {
    const validData: ClusterResult = {
      meta: {
        totalPages: 10,
        clustersFound: 5,
      },
      clusters: [
        {
          name: 'Web Development',
          keywords: ['react', 'nextjs', 'typescript'],
          pageRefs: [
            { pageId: 'page-1', title: 'React Basics' },
            { pageId: 'page-2', title: 'Next.js Guide' },
          ],
        },
        {
          name: 'Backend',
          keywords: ['nodejs', 'express', 'api'],
          pageRefs: [
            { pageId: 'page-3', title: 'API Design' },
          ],
        },
      ],
      topKeywords: [
        { keyword: 'react', count: 8 },
        { keyword: 'typescript', count: 6 },
        { keyword: 'nextjs', count: 5 },
      ],
    };

    const result = ClusterResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should reject invalid meta structure', () => {
    const invalidData = {
      meta: {
        totalPages: '10', // should be number
        clustersFound: 5,
      },
      clusters: [],
      topKeywords: [],
    };

    const result = ClusterResultSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      meta: {
        totalPages: 10,
        // missing clustersFound
      },
      clusters: [],
      topKeywords: [],
    };

    const result = ClusterResultSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid cluster structure', () => {
    const invalidData = {
      meta: {
        totalPages: 10,
        clustersFound: 1,
      },
      clusters: [
        {
          name: 'Test',
          keywords: 'not-an-array', // should be array
          pageRefs: [],
        },
      ],
      topKeywords: [],
    };

    const result = ClusterResultSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid pageRefs type', () => {
    const invalidData = {
      meta: {
        totalPages: 10,
        clustersFound: 1,
      },
      clusters: [
        {
          name: 'Test',
          keywords: ['keyword1'],
          pageRefs: ['page-1', 'page-2'], // should be { pageId, title }[]
        },
      ],
      topKeywords: [],
    };

    const result = ClusterResultSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject pageRefs with missing title', () => {
    const invalidData = {
      meta: {
        totalPages: 10,
        clustersFound: 1,
      },
      clusters: [
        {
          name: 'Test',
          keywords: ['keyword1'],
          pageRefs: [{ pageId: 'page-1' }], // missing title
        },
      ],
      topKeywords: [],
    };

    const result = ClusterResultSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid topKeywords structure', () => {
    const invalidData = {
      meta: {
        totalPages: 10,
        clustersFound: 0,
      },
      clusters: [],
      topKeywords: [
        {
          keyword: 'test',
          count: '5', // should be number
        },
      ],
    };

    const result = ClusterResultSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should throw ZodError on parse failure', () => {
    const invalidData = {
      meta: {},
      clusters: 'not-an-array',
      topKeywords: null,
    };

    expect(() => ClusterResultSchema.parse(invalidData)).toThrow();
  });

  it('should accept empty clusters and topKeywords', () => {
    const validData: ClusterResult = {
      meta: {
        totalPages: 0,
        clustersFound: 0,
      },
      clusters: [],
      topKeywords: [],
    };

    const result = ClusterResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate nested array types', () => {
    const validData: ClusterResult = {
      meta: {
        totalPages: 3,
        clustersFound: 1,
      },
      clusters: [
        {
          name: 'Mixed',
          keywords: ['a', 'b', 'c'],
          pageRefs: [
            { pageId: 'id-1', title: 'Page A' },
            { pageId: 'id-2', title: 'Page B' },
            { pageId: 'id-3', title: 'Page C' },
          ],
        },
      ],
      topKeywords: [
        { keyword: 'a', count: 3 },
        { keyword: 'b', count: 2 },
        { keyword: 'c', count: 1 },
      ],
    };

    const result = ClusterResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
