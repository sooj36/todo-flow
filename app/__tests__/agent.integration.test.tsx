import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Home from '../page';

// Mock the hooks to avoid API calls for calendar/board
vi.mock('@/hooks/useTaskInstances', () => ({
    useTaskInstances: vi.fn(() => ({
        instances: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
    })),
}));

vi.mock('@/hooks/useTaskTemplates', () => ({
    useTaskTemplates: vi.fn(() => ({
        templates: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
    })),
}));

describe('Agent UI Integration', () => {
    let fetchMock: vi.Mock;

    beforeEach(() => {
        fetchMock = vi.fn() as vi.Mock;
        global.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should complete search → loading → result flow', async () => {
        const user = userEvent.setup();

        // Mock successful API response
        const mockResult = {
            meta: {
                totalPages: 5,
                totalKeywords: 20,
            },
            clusters: [
                {
                    label: '테스트 클러스터',
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

        render(<Home />);

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

        // Verify progress indicator shows phases
        expect(screen.getByText('Notion에서 완료 페이지 조회 중...')).toBeInTheDocument();

        // Wait for completion
        await waitFor(() => {
            expect(screen.getByText('완료')).toBeInTheDocument();
        });

        // Verify result panel displays
        expect(screen.getByText('분석된 페이지:')).toBeInTheDocument();
        expect(screen.getByText('5개')).toBeInTheDocument();
        expect(screen.getByText('총 키워드:')).toBeInTheDocument();
        expect(screen.getByText('20개')).toBeInTheDocument();
        expect(screen.getByText('테스트 클러스터')).toBeInTheDocument();
        expect(screen.getByText('키워드1')).toBeInTheDocument();
    });

    it('should handle error and retry flow', async () => {
        const user = userEvent.setup();

        // Mock failed API response
        fetchMock.mockRejectedValueOnce(new Error('API Error'));

        render(<Home />);

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
            meta: {
                totalPages: 1,
                totalKeywords: 3,
            },
            clusters: [
                {
                    label: '재시도 클러스터',
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
            expect(fetchMock).toHaveBeenCalledWith(
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
});
