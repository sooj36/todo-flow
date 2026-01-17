// lib/agent/schema.test.ts
import { describe, it, expect } from 'vitest';
import { ClusterResultSchema } from './schema';
import { buildFallbackResult } from './fallback';
import type { ClusterResult, KeywordPage } from './clustering';

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

  describe('schema validation failure → fallback', () => {
    it('should use safeParse to detect invalid LLM response without throwing', () => {
      const malformedLLMResponse = {
        meta: { totalPages: 'not-a-number' }, // Invalid type
        clusters: 'not-an-array',
        topKeywords: null,
      };

      const result = ClusterResultSchema.safeParse(malformedLLMResponse);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should allow fallback result when LLM response fails validation', () => {
      const pages: KeywordPage[] = [
        { pageId: 'page-1', title: 'Test', keywords: ['react', 'vue'] },
      ];

      // Simulate: LLM returns invalid response
      const invalidLLMResponse = { invalid: 'structure' };
      const parseResult = ClusterResultSchema.safeParse(invalidLLMResponse);

      expect(parseResult.success).toBe(false);

      // Fallback: use frequency-based result instead
      const fallbackResult = buildFallbackResult(pages);
      const fallbackParseResult = ClusterResultSchema.safeParse(fallbackResult);

      expect(fallbackParseResult.success).toBe(true);
      expect(fallbackResult.meta.clustersFound).toBe(0);
      expect(fallbackResult.topKeywords.length).toBeGreaterThan(0);
    });

    it('should catch ZodError and trigger fallback path', () => {
      const invalidData = { meta: {}, clusters: 'invalid' };

      let fallbackTriggered = false;

      try {
        ClusterResultSchema.parse(invalidData);
      } catch (error) {
        // In production, this catch block triggers buildFallbackResult
        fallbackTriggered = true;
        expect(error).toBeDefined();
      }

      expect(fallbackTriggered).toBe(true);
    });
  });
});
