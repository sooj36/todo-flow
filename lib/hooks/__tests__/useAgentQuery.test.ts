import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAgentQuery } from '../useAgentQuery';

describe('useAgentQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should initialize with idle phase', () => {
    const { result } = renderHook(() => useAgentQuery());

    expect(result.current.phase).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.executeQuery).toBe('function');
    expect(typeof result.current.retry).toBe('function');
  });

  it('should change phase to fetch when executeQuery is called', async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    (global.fetch as any).mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() => useAgentQuery());

    result.current.executeQuery('test query');

    await waitFor(() => {
      expect(result.current.phase).toBe('fetch');
    });

    // Resolve the fetch to clean up
    resolveFetch!({
      ok: true,
      json: async () => ({
        pageId: 'page-1',
        title: '테스트',
        source: { from: 'toggle' },
        summary: { bullets: ['a'], model: 'gemini-2.0-flash-exp', tokenLimit: 120 },
      }),
    });
  });

  it('should update phase through fetch → normalize → cluster → done on success', async () => {
    const mockResponse = {
      pageId: 'page-1',
      title: '테스트',
      source: { from: 'toggle' },
      summary: {
        bullets: ['조건1', '조건2'],
        model: 'gemini-2.0-flash-exp',
        tokenLimit: 120,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAgentQuery());

    await result.current.executeQuery('test query');

    await waitFor(() => {
      expect(result.current.phase).toBe('done');
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
    });
  });

  it('should set phase to error and store error message on failure', async () => {
    const errorMessage = 'API Error';
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
      json: async () => ({ error: errorMessage }),
    });

    const { result } = renderHook(() => useAgentQuery());

    await result.current.executeQuery('test query');

    await waitFor(() => {
      expect(result.current.phase).toBe('error');
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });
  });

  it('should send POST request to /api/agent/project with queryText in body', async () => {
    const mockResponse = {
      pageId: 'page-1',
      title: '테스트',
      source: { from: 'toggle' },
      summary: { bullets: ['a'], model: 'gemini-2.0-flash-exp', tokenLimit: 120 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAgentQuery());

    await result.current.executeQuery('search term');

    expect(global.fetch).toHaveBeenCalledWith('/api/agent/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryText: 'search term' }),
    });
  });

  it('should retry with last queryText when retry is called', async () => {
    const mockResponse = {
      pageId: 'page-1',
      title: '테스트',
      source: { from: 'toggle' },
      summary: { bullets: ['a'], model: 'gemini-2.0-flash-exp', tokenLimit: 120 },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAgentQuery());

    await result.current.executeQuery('original query');

    vi.clearAllMocks();

    await result.current.retry();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText: 'original query' }),
      });
    });
  });

  it('should do nothing and warn when retry is called without previous query', async () => {
    const { result } = renderHook(() => useAgentQuery());

    await result.current.retry();

    expect(console.warn).toHaveBeenCalledWith('재시도할 검색어가 없습니다');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
