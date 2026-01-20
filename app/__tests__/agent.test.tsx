// app/__tests__/agent.test.tsx
// Focused Agent UI integration tests (without full page rendering)
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchBar } from '@/components/agent/SearchBar';
import { ProgressIndicator } from '@/components/agent/ProgressIndicator';
import { QualificationPanel } from '@/components/agent/QualificationPanel';
import { useAgentQuery } from '@/lib/hooks/useAgentQuery';

// Test wrapper component that mimics the agent section of Home
function AgentSection() {
  const { phase, data, error, executeQuery, retry } = useAgentQuery();

  return (
    <div>
      <SearchBar onSearch={executeQuery} />
      <ProgressIndicator phase={phase} error={error ?? undefined} onRetry={retry} />
      {phase === 'done' && data && <QualificationPanel data={data} />}
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
    const mockResult = {
      pageId: 'page-1',
      title: '뱅크샐러드',
      source: { from: 'toggle', rawLength: 42 },
      summary: {
        bullets: ['조건1', '조건2'],
        model: 'gemini-2.0-flash-exp',
        tokenLimit: 120,
      },
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
        '/api/agent/project',
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

    expect(screen.getByText('뱅크샐러드')).toBeInTheDocument();
    expect(screen.getByText('조건1')).toBeInTheDocument();
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
    const mockResult = {
      pageId: 'page-1',
      title: '재시도',
      source: { from: 'page' },
      summary: { bullets: ['재시도'], model: 'gemini-2.0-flash-exp', tokenLimit: 120 },
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
        '/api/agent/project',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ queryText: '실패 테스트' }),
        })
      );
    });

    // Verify success after retry
    await waitFor(() => {
      expect(screen.getByText('완료')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '재시도' })).toBeInTheDocument();
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
      expect(screen.getByText('Project DB 조회 중...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({
        pageId: 'page-1',
        title: '테스트',
        source: { from: 'page' },
        summary: { bullets: ['a'], model: 'gemini-2.0-flash-exp', tokenLimit: 120 },
      }),
    });

    // Verify completion
    await waitFor(() => {
      expect(screen.getByText('완료')).toBeInTheDocument();
    });
  });
});
