// components/flow/FlowBoardRefetch.test.tsx
// Phase 14.5: FlowBoard refreshTrigger 통합 테스트

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { FlowBoard } from "./FlowBoard";

// Mock hooks
const mockRefetchInstances = vi.fn();
const mockRefetchTemplates = vi.fn();

vi.mock("@/hooks/useTaskInstances", () => ({
  useTaskInstances: () => ({
    instances: [],
    loading: false,
    error: null,
    refetch: mockRefetchInstances,
  }),
}));

vi.mock("@/hooks/useTaskTemplates", () => ({
  useTaskTemplates: () => ({
    templates: [],
    loading: false,
    error: null,
    refetch: mockRefetchTemplates,
  }),
}));

vi.mock("@/hooks/useFlowSync", () => ({
  useFlowSync: () => ({
    isSyncing: false,
    syncSuccess: false,
    syncError: false,
    syncErrorMessage: "",
    handleSync: vi.fn(),
    syncTimeoutRef: { current: null },
    setSyncError: vi.fn(),
    setSyncSuccess: vi.fn(),
    setSyncErrorMessage: vi.fn(),
  }),
}));

vi.mock("@/hooks/useFlowSteps", () => ({
  useFlowSteps: () => ({
    stepOverrides: {},
    stepUpdating: {},
    handleToggleFlowStep: vi.fn(),
  }),
}));

// Mock ReactFlow to avoid DOM measurement issues in tests
vi.mock("reactflow", () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="react-flow-mock">{children}</div>
  ),
  Controls: () => <div data-testid="controls-mock" />,
  Background: () => <div data-testid="background-mock" />,
  MiniMap: () => <div data-testid="minimap-mock" />,
  BackgroundVariant: { Dots: "dots" },
  useNodesState: (initial: any[]) => [initial, vi.fn(), vi.fn()],
  useEdgesState: (initial: any[]) => [initial, vi.fn(), vi.fn()],
}));

vi.mock("@/utils/nodePositions", () => ({
  loadNodePositions: () => ({}),
  saveNodePositions: vi.fn(),
}));

vi.mock("@/utils/flowNodes", () => ({
  createFlowNodes: () => ({ nodes: [], edges: [] }),
}));

describe("FlowBoard RefreshTrigger Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetchInstances.mockResolvedValue({ success: true });
    mockRefetchTemplates.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("RefreshTrigger Prop Changes", () => {
    it("should not refetch on initial render", () => {
      render(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={0} />);

      // On initial render, refetch should NOT be called from refreshTrigger effect
      // (The hooks themselves may call fetch initially, but not the trigger effect)
      expect(mockRefetchInstances).not.toHaveBeenCalled();
      expect(mockRefetchTemplates).not.toHaveBeenCalled();
    });

    it("should refetch both templates and instances when refreshTrigger changes", async () => {
      const { rerender } = render(
        <FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={0} />
      );

      // Clear any initial calls
      vi.clearAllMocks();

      // Simulate parent triggering refresh (e.g., after task creation)
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={1} />);

      await waitFor(() => {
        expect(mockRefetchTemplates).toHaveBeenCalled();
        expect(mockRefetchInstances).toHaveBeenCalled();
      });
    });

    it("should refetch on each increment of refreshTrigger", async () => {
      const { rerender } = render(
        <FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={0} />
      );

      vi.clearAllMocks();

      // First increment
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={1} />);

      await waitFor(() => {
        expect(mockRefetchTemplates).toHaveBeenCalledTimes(1);
        expect(mockRefetchInstances).toHaveBeenCalledTimes(1);
      });

      // Second increment
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={2} />);

      await waitFor(() => {
        expect(mockRefetchTemplates).toHaveBeenCalledTimes(2);
        expect(mockRefetchInstances).toHaveBeenCalledTimes(2);
      });

      // Third increment
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={3} />);

      await waitFor(() => {
        expect(mockRefetchTemplates).toHaveBeenCalledTimes(3);
        expect(mockRefetchInstances).toHaveBeenCalledTimes(3);
      });
    });

    it("should not refetch if refreshTrigger stays the same value", async () => {
      const { rerender } = render(
        <FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={1} />
      );

      vi.clearAllMocks();

      // Same value - no refetch
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={1} />);

      // Wait a bit to ensure no calls are made
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRefetchTemplates).not.toHaveBeenCalled();
      expect(mockRefetchInstances).not.toHaveBeenCalled();
    });

    it("should handle undefined refreshTrigger gracefully", () => {
      const { rerender } = render(
        <FlowBoard selectedDate={new Date(2026, 0, 20)} />
      );

      vi.clearAllMocks();

      // Going from undefined to undefined should not cause issues
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} />);

      // No errors should occur and no refetch should be triggered
      expect(mockRefetchTemplates).not.toHaveBeenCalled();
      expect(mockRefetchInstances).not.toHaveBeenCalled();
    });

    it("should refetch when going from undefined to a number", async () => {
      const { rerender } = render(
        <FlowBoard selectedDate={new Date(2026, 0, 20)} />
      );

      vi.clearAllMocks();

      // Undefined -> 1 should trigger refetch
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={1} />);

      await waitFor(() => {
        expect(mockRefetchTemplates).toHaveBeenCalled();
        expect(mockRefetchInstances).toHaveBeenCalled();
      });
    });
  });

  describe("RefreshTrigger with Date Change", () => {
    it("should handle both date change and refreshTrigger change", async () => {
      const { rerender } = render(
        <FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={0} />
      );

      vi.clearAllMocks();

      // Change both date and trigger
      rerender(<FlowBoard selectedDate={new Date(2026, 0, 21)} refreshTrigger={1} />);

      await waitFor(() => {
        // RefreshTrigger change should trigger refetch
        expect(mockRefetchTemplates).toHaveBeenCalled();
        expect(mockRefetchInstances).toHaveBeenCalled();
      });
    });
  });
});

describe("FlowBoard Integration Contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetchInstances.mockResolvedValue({ success: true });
    mockRefetchTemplates.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
  });

  it("should accept refreshTrigger prop for parent-controlled refetch", () => {
    // This test verifies the contract: FlowBoard accepts refreshTrigger
    // and uses it to trigger refetch when the value changes
    const { rerender } = render(
      <FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={0} />
    );

    // The component should render without errors
    expect(document.querySelector('[data-testid="react-flow-mock"]')).toBeTruthy();

    vi.clearAllMocks();

    // When parent increments refreshTrigger, FlowBoard should refetch
    rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={1} />);

    // Verify refetch was called
    expect(mockRefetchTemplates).toHaveBeenCalled();
    expect(mockRefetchInstances).toHaveBeenCalled();
  });

  it("should call both refetchTemplates and refetchInstances together", async () => {
    const { rerender } = render(
      <FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={0} />
    );

    vi.clearAllMocks();

    rerender(<FlowBoard selectedDate={new Date(2026, 0, 20)} refreshTrigger={1} />);

    await waitFor(() => {
      // Both should be called - templates for the new task template
      // and instances for the new task instance
      expect(mockRefetchTemplates).toHaveBeenCalledTimes(1);
      expect(mockRefetchInstances).toHaveBeenCalledTimes(1);
    });
  });
});
