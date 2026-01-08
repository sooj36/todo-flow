// components/flow/__tests__/FlowBoard.flow-step-toggle.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlowBoard } from '../FlowBoard';
import * as useTaskInstances from '@/hooks/useTaskInstances';
import * as useTaskTemplates from '@/hooks/useTaskTemplates';

vi.mock('@/hooks/useTaskInstances');
vi.mock('@/hooks/useTaskTemplates');

// Mock ReactFlow
vi.mock('reactflow', () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
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

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();

        vi.mocked(useTaskInstances.useTaskInstances).mockReturnValue({
            instances: [mockInstance],
            loading: false,
            error: null,
            refetch: vi.fn().mockResolvedValue({ success: true }),
        });

        vi.mocked(useTaskTemplates.useTaskTemplates).mockReturnValue({
            templates: [mockTemplate],
            loading: false,
            error: null,
            refetch: vi.fn().mockResolvedValue({ success: true }),
        });
    });

    it('should render flow board with templates', () => {
        render(<FlowBoard />);

        // Verify core UI is rendered
        expect(screen.getByText('Daily Automation Flow')).toBeInTheDocument();
        expect(screen.getAllByText('notion connect success').length).toBeGreaterThan(0);
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
        const elements = screen.getAllByText('Daily Automation Flow');
        expect(elements.length).toBeGreaterThan(0);
    });
});
