// components/flow/__tests__/FlowBoard.flow-step-toggle.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FlowBoard } from '../FlowBoard';
import * as useTaskInstances from '@/hooks/useTaskInstances';
import * as useTaskTemplates from '@/hooks/useTaskTemplates';

vi.mock('@/hooks/useTaskInstances');
vi.mock('@/hooks/useTaskTemplates');

// Mock ReactFlow
vi.mock('reactflow', () => ({
    __esModule: true,
    default: ({ children, nodes = [], nodeTypes = {} }: any) => (
        <div data-testid="react-flow">
            {nodes.map((node: any) => {
                const Component = nodeTypes[node.type];
                return Component ? <Component key={node.id} id={node.id} data={node.data} /> : null;
            })}
            {children}
        </div>
    ),
    Controls: () => <div>Controls</div>,
    Background: () => <div>Background</div>,
    MiniMap: () => <div>MiniMap</div>,
    useNodesState: (initial: any) => [initial, vi.fn(), vi.fn()],
    useEdgesState: (initial: any) => [initial, vi.fn(), vi.fn()],
    BackgroundVariant: { Dots: 'dots' },
    Handle: () => <div>Handle</div>,
    Position: { Left: 'left', Right: 'right' },
}));

describe('FlowBoard - Flow Step Refactoring', () => {
    const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        icon: '📝',
        color: 'blue' as const,
        isRepeating: true,
        defaultFrequency: 'daily' as const,
        active: true,
        flowSteps: [
            {
                id: 'step-1',
                name: 'Step 1',
                order: 1,
                parentTemplateId: 'template-1',
                done: false,
            },
            {
                id: 'step-2',
                name: 'Step 2',
                order: 2,
                parentTemplateId: 'template-1',
                done: true,
            },
        ],
    };

    const mockInstance = {
        id: 'instance-1',
        templateId: 'template-1',
        template: mockTemplate,
        date: '2026-01-08',
        status: 'todo' as const,
        currentStepId: null,
        completedStepIds: [],
        createdAt: '2026-01-08T00:00:00Z',
        completedAt: null,
    };

    const instancesValue = {
        instances: [mockInstance],
        loading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ success: true }),
    };

    const templatesValue = {
        templates: [mockTemplate],
        loading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ success: true }),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        instancesValue.refetch.mockClear();
        templatesValue.refetch.mockClear();

        vi.mocked(useTaskInstances.useTaskInstances).mockReturnValue(instancesValue);
        vi.mocked(useTaskTemplates.useTaskTemplates).mockReturnValue(templatesValue);
    });

    afterEach(() => {
        cleanup();
    });

    it('should render flow board with templates', () => {
        render(<FlowBoard />);

        // Verify core UI is rendered
        expect(screen.getAllByText('Notion connected').length).toBeGreaterThan(0);
    });

    it('should verify FlowStep.done type safety', () => {
        // Type safety test: FlowStep.done is now required (not optional)
        const flowStep = mockTemplate.flowSteps[0];
        expect(flowStep.done).toBeDefined();
        expect(typeof flowStep.done).toBe('boolean');
    });

    it('should handle component rendering with flowSteps', () => {
        // Verify that refactoring doesn't break rendering
        const { rerender } = render(<FlowBoard />);

        // Re-render to ensure state management works correctly
        rerender(<FlowBoard />);

        // Component should remain stable (getAllByText for rerender scenario)
        expect(screen.getAllByText('Notion connected').length).toBeGreaterThan(0);
    });

    it('토글 시 진행률/퍼센트가 즉시 갱신된다', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        render(<FlowBoard />);

        // 초기 진행률: 1/2 (50%)
        const progressBox = screen.getAllByTestId('flow-progress')[0];
        const progressPercents = () => screen.getAllByTestId('flow-progress-percent').map(el => el.textContent);
        expect(progressBox).toBeInTheDocument();
        expect(progressBox).toHaveTextContent('1/2');
        expect(progressPercents()).toContain('50%');

        // Step 1 토글 → 낙관적 업데이트로 즉시 2/2, 100%
        const firstCheckbox = screen.getAllByLabelText('Step 1 완료')[0];
        fireEvent.click(firstCheckbox);

        await waitFor(() => {
            expect(progressPercents()).toContain('100%');
            const progressTexts = screen.getAllByTestId('flow-progress').map(el => el.textContent || '');
            expect(progressTexts.some(text => text.includes('2/2'))).toBe(true);
        });
        expect(global.fetch).toHaveBeenCalledWith('/api/notion/flow-steps/step-1', expect.anything());
    });

    it('API 실패 시 진행률이 롤백된다', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'fail' }),
        });

        render(<FlowBoard />);

        const firstCheckbox = screen.getAllByLabelText('Step 1 완료')[0];
        fireEvent.click(firstCheckbox);

        // 낙관적 업데이트로 일단 100%
        await waitFor(() => {
            const progressTexts = screen.getAllByTestId('flow-progress').map(el => el.textContent || '');
            expect(progressTexts.some(text => text.includes('2/2'))).toBe(true);
        });

        // 실패 처리 후 50%로 롤백
        await waitFor(() => {
            const progressTexts = screen.getAllByTestId('flow-progress').map(el => el.textContent || '');
            expect(progressTexts.some(text => text.includes('1/2'))).toBe(true);
            const percents = screen.getAllByTestId('flow-progress-percent').map(el => el.textContent);
            expect(percents).toContain('50%');
        });
    });

    it('연속 토글 시 누적 반영된다', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        render(<FlowBoard />);

        const firstCheckbox = screen.getAllByLabelText('Step 1 완료')[0];
        const secondCheckbox = screen.getAllByLabelText('Step 2 완료')[0];

        // 1번째 토글: 2/2로 갱신
        fireEvent.click(firstCheckbox);
        await waitFor(() => {
            const percents = screen.getAllByTestId('flow-progress-percent').map(el => el.textContent);
            expect(percents).toContain('100%');
        });

        // 2번째 토글: 1/2로 감소
        fireEvent.click(secondCheckbox);
        await waitFor(() => {
            const progressTexts = screen.getAllByTestId('flow-progress').map(el => el.textContent || '');
            expect(progressTexts.some(text => text.includes('1/2'))).toBe(true);
            const percents = screen.getAllByTestId('flow-progress-percent').map(el => el.textContent);
            expect(percents).toContain('50%');
        });

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/notion/flow-steps/step-1', expect.anything());
        expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/notion/flow-steps/step-2', expect.anything());
    });

    it('stepUpdating 중 중복 토글을 막아 퍼센트가 튀지 않는다', async () => {
        const fetchResponse = { ok: true, json: async () => ({}) };
        let resolveFetch: ((value: typeof fetchResponse) => void) | undefined;
        const fetchPromise = new Promise<typeof fetchResponse>((resolve) => {
            resolveFetch = resolve;
        });
        global.fetch = vi.fn(() => fetchPromise as unknown as Promise<Response>);

        render(<FlowBoard />);

        const firstCheckbox = screen.getAllByLabelText('Step 1 완료')[0];

        // 첫 클릭: in-flight 상태
        fireEvent.click(firstCheckbox);

        // 중복 클릭: 무시되어 fetch 1회 유지
        fireEvent.click(firstCheckbox);

        resolveFetch?.(fetchResponse);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const percents = screen.getAllByTestId('flow-progress-percent').map(el => el.textContent);
            expect(percents).toContain('100%');
        });
    });
});
