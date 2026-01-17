// app/__tests__/agent.test.tsx
// Focused Agent UI integration tests (without full page rendering)
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchBar } from '@/components/agent/SearchBar';
import { ProgressIndicator } from '@/components/agent/ProgressIndicator';
import { ClusterResultPanel } from '@/components/agent/ClusterResultPanel';
import { useAgentQuery } from '@/lib/hooks/useAgentQuery';
import type { ClusterResult } from '@/lib/agent/schema';

// Test wrapper component that mimics the agent section of Home
function AgentSection() {
  const { phase, data, error, executeQuery, retry } = useAgentQuery();

  return (
    <div>
      <SearchBar onSearch={executeQuery} />
      <ProgressIndicator phase={phase} error={error ?? undefined} onRetry={retry} />
      {phase === 'done' && data && <ClusterResultPanel data={data} />}
    </div>
  );
}

describe('Agent UI Integration', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should complete search → loading → result flow', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    const mockResult: ClusterResult = {
      meta: {
        totalPages: 5,
        clustersFound: 1,
      },
      clusters: [
        {
          name: '테스트 클러스터',
          keywords: ['키워드1', '키워드2'],
          pageRefs: [{ pageId: 'page1', title: '테스트 페이지' }],
        },
      ],
      topKeywords: [
        { keyword: '키워드1', count: 3 },
      ],
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    render(<AgentSection />);

    // Find search input
    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    expect(searchInput).toBeInTheDocument();

    // Type query
    await user.type(searchInput, '테스트 검색');

    // Press Enter
    await user.keyboard('{Enter}');

    // Verify API was called
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/agent/keywords',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryText: '테스트 검색' }),
        })
      );
    });

    // Wait for completion and verify result panel displays
    await waitFor(() => {
      expect(screen.getByText('완료')).toBeInTheDocument();
    });

    expect(screen.getByText('분석된 페이지:')).toBeInTheDocument();
    expect(screen.getByText('5개')).toBeInTheDocument();
    expect(screen.getByText('클러스터 수:')).toBeInTheDocument();
    expect(screen.getByText('1개')).toBeInTheDocument();
    expect(screen.getByText('테스트 클러스터')).toBeInTheDocument();
    // 키워드1 appears in both cluster keywords and topKeywords
    expect(screen.getAllByText('키워드1').length).toBeGreaterThanOrEqual(1);
  });

  it('should handle error and retry flow', async () => {
    const user = userEvent.setup();

    // Mock failed API response first
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'API Error' }),
    });

    render(<AgentSection />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');

    // Execute search
    await user.type(searchInput, '실패 테스트');
    await user.keyboard('{Enter}');

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    // Verify retry button appears
    const retryButton = screen.getByRole('button', { name: '다시 시도' });
    expect(retryButton).toBeInTheDocument();

    // Mock successful response for retry
    const mockResult: ClusterResult = {
      meta: {
        totalPages: 1,
        clustersFound: 1,
      },
      clusters: [
        {
          name: '재시도 클러스터',
          keywords: ['재시도'],
          pageRefs: [{ pageId: 'retry1', title: '재시도 페이지' }],
        },
      ],
      topKeywords: [{ keyword: '재시도', count: 1 }],
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    });

    // Click retry
    await user.click(retryButton);

    // Verify retry uses the same query (마지막 queryText 유지)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/agent/keywords',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ queryText: '실패 테스트' }),
        })
      );
    });

    // Verify success after retry
    await waitFor(() => {
      expect(screen.getByText('완료')).toBeInTheDocument();
      expect(screen.getByText('재시도 클러스터')).toBeInTheDocument();
    });
  });

  it('should show progress phases during loading', async () => {
    const user = userEvent.setup();

    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    fetchMock.mockReturnValueOnce(pendingPromise);

    render(<AgentSection />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');

    // Execute search
    await user.type(searchInput, '로딩 테스트');
    await user.keyboard('{Enter}');

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText('Notion에서 완료 페이지 조회 중...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({
        meta: { totalPages: 1, clustersFound: 0 },
        clusters: [],
        topKeywords: [],
      }),
    });

    // Verify completion
    await waitFor(() => {
      expect(screen.getByText('완료')).toBeInTheDocument();
    });
  });
});
