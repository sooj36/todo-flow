import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlowBoard } from "./FlowBoard";

vi.mock("reactflow", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
  Controls: () => <div data-testid="react-flow-controls" />,
  Background: () => <div data-testid="react-flow-background" />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`react-flow-handle-${type}-${position}`} />
  ),
  useNodesState: (initialNodes: unknown[]) => [initialNodes, vi.fn(), vi.fn()],
  useEdgesState: (initialEdges: unknown[]) => [initialEdges, vi.fn(), vi.fn()],
  BackgroundVariant: { Dots: "dots" },
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
}));

vi.mock("@/hooks/useTaskInstances", () => ({
  useTaskInstances: vi.fn(() => ({
    instances: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock("@/hooks/useTaskTemplates", () => ({
  useTaskTemplates: vi.fn(() => ({
    templates: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

describe("FlowBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the connected state with React Flow", () => {
    render(<FlowBoard />);

    expect(screen.getByText("Daily Automation Flow")).toBeInTheDocument();
    expect(screen.getAllByText("notion connect success").length).toBeGreaterThan(0);

    // React Flow components should be rendered
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow-controls")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow-background")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow-minimap")).toBeInTheDocument();

    expect(screen.getByText("DATABASE ID: —")).toBeInTheDocument();
    expect(screen.getByText("Auto-save disabled until connected")).toBeInTheDocument();
  });
});
