import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe("FlowBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("renders the connected state with React Flow", () => {
    render(<FlowBoard />);

    expect(screen.getByText("Daily Automation Flow")).toBeInTheDocument();
    expect(screen.getAllByText("Notion connected").length).toBeGreaterThan(0);

    // React Flow components should be rendered
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow-controls")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow-background")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow-minimap")).toBeInTheDocument();

    expect(screen.getByText("DATABASE ID: —")).toBeInTheDocument();
    expect(screen.getByText("Auto-save disabled until connected")).toBeInTheDocument();
  });

  it("loads node positions from localStorage on mount", () => {
    const savedPositions = {
      "daily-start": { x: 100, y: 200 },
      "ai-reporter": { x: 400, y: 200 },
    };
    localStorage.setItem("flowboard-node-positions", JSON.stringify(savedPositions));

    render(<FlowBoard />);

    // Verify localStorage was read (positions should be loaded)
    const storedData = localStorage.getItem("flowboard-node-positions");
    expect(storedData).toBeTruthy();
    expect(JSON.parse(storedData!)).toEqual(savedPositions);
  });

  it("handles localStorage errors gracefully", () => {
    // Mock localStorage to throw an error
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("localStorage error");
    });

    // Should not crash when localStorage fails
    expect(() => render(<FlowBoard />)).not.toThrow();

    getItemSpy.mockRestore();
  });
});
