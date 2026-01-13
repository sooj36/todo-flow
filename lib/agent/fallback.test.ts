// lib/agent/fallback.test.ts
import { describe, it, expect } from 'vitest';
import { buildFallbackResult } from './fallback';
import type { KeywordPage } from './clustering';

describe('buildFallbackResult', () => {
  it('should return empty result for empty pages', () => {
    const pages: KeywordPage[] = [];
    const result = buildFallbackResult(pages);

    expect(result.meta.totalPages).toBe(0);
    expect(result.meta.clustersFound).toBe(0);
    expect(result.clusters).toEqual([]);
    expect(result.topKeywords).toEqual([]);
  });

  it('should count keyword frequencies across all pages', () => {
    const pages: KeywordPage[] = [
      {
        pageId: 'page-1',
        title: 'React Guide',
        keywords: ['react', 'hooks', 'typescript'],
      },
      {
        pageId: 'page-2',
        title: 'React Advanced',
        keywords: ['react', 'typescript', 'performance'],
      },
      {
        pageId: 'page-3',
        title: 'Vue Guide',
        keywords: ['vue', 'typescript'],
      },
    ];

    const result = buildFallbackResult(pages);

    expect(result.meta.totalPages).toBe(3);
    expect(result.meta.clustersFound).toBe(0);
    expect(result.clusters).toEqual([]);
    expect(result.topKeywords).toHaveLength(5);

    // Check top keywords are sorted by count (descending)
    expect(result.topKeywords[0]).toEqual({ keyword: 'typescript', count: 3 });
    expect(result.topKeywords[1]).toEqual({ keyword: 'react', count: 2 });
  });

  it('should limit topKeywords to 10 items', () => {
    const pages: KeywordPage[] = [
      {
        pageId: 'page-1',
        title: 'Test',
        keywords: [
          'kw1', 'kw2', 'kw3', 'kw4', 'kw5',
          'kw6', 'kw7', 'kw8', 'kw9', 'kw10',
          'kw11', 'kw12', 'kw13', 'kw14', 'kw15',
        ],
      },
    ];

    const result = buildFallbackResult(pages);

    expect(result.topKeywords).toHaveLength(10);
  });

  it('should handle duplicate keywords in same page', () => {
    const pages: KeywordPage[] = [
      {
        pageId: 'page-1',
        title: 'Test',
        keywords: ['react', 'react', 'vue'],
      },
    ];

    const result = buildFallbackResult(pages);

    // Each keyword occurrence should be counted
    expect(result.topKeywords).toEqual([
      { keyword: 'react', count: 2 },
      { keyword: 'vue', count: 1 },
    ]);
  });

  it('should sort keywords by count descending, then alphabetically', () => {
    const pages: KeywordPage[] = [
      {
        pageId: 'page-1',
        title: 'Test',
        keywords: ['beta', 'alpha', 'gamma', 'alpha', 'beta', 'alpha'],
      },
    ];

    const result = buildFallbackResult(pages);

    expect(result.topKeywords).toEqual([
      { keyword: 'alpha', count: 3 },
      { keyword: 'beta', count: 2 },
      { keyword: 'gamma', count: 1 },
    ]);
  });

  it('should normalize keywords (trim, lowercase)', () => {
    const pages: KeywordPage[] = [
      {
        pageId: 'page-1',
        title: 'Test',
        keywords: ['  React  ', 'REACT', 'react'],
      },
    ];

    const result = buildFallbackResult(pages);

    expect(result.topKeywords).toEqual([
      { keyword: 'react', count: 3 },
    ]);
  });

  it('should filter out empty keywords after normalization', () => {
    const pages: KeywordPage[] = [
      {
        pageId: 'page-1',
        title: 'Test',
        keywords: ['react', '  ', '', 'vue'],
      },
    ];

    const result = buildFallbackResult(pages);

    expect(result.topKeywords).toEqual([
      { keyword: 'react', count: 1 },
      { keyword: 'vue', count: 1 },
    ]);
  });
});
