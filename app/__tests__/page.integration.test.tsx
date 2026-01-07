import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "../page";

// Mock the hooks to avoid API calls
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

describe("Dashboard Integration Tests", () => {
  it("should render the main page with all sections", () => {
    render(<Home />);

    // Sidebar
    expect(screen.getByText("Flow Planner")).toBeInTheDocument();

    // Calendar
    const monthLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date());
    expect(screen.getByText(`📅 ${monthLabel}`)).toBeInTheDocument();
    expect(screen.getByText("Phase 01: 01 — 15")).toBeInTheDocument();
    expect(screen.getByText("Phase 02: 16 — 31")).toBeInTheDocument();

    // FlowBoard
    expect(screen.getByText("Daily Automation Flow")).toBeInTheDocument();
    expect(screen.getByText("No tasks for today")).toBeInTheDocument();
  });

  it("should render calendar day cells in both phases", () => {
    render(<Home />);

    // Verify phase headers exist
    expect(screen.getAllByText("Phase 01: 01 — 15").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Phase 02: 16 — 31").length).toBeGreaterThan(0);

    // Verify that day numbers are rendered (these appear in calendar grid)
    // Using getAllByText since numbers can appear in multiple contexts
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("15").length).toBeGreaterThan(0);
    expect(screen.getAllByText("16").length).toBeGreaterThan(0);
    expect(screen.getAllByText("31").length).toBeGreaterThan(0);
  });

  it("should render FlowBoard elements", () => {
    render(<Home />);

    // Check FlowBoard header and status (using getAllByText for elements that may appear multiple times)
    expect(screen.getAllByText("Daily Automation Flow").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/connected to notion/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("DATABASE ID: —").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Auto-save disabled until connected").length).toBeGreaterThan(0);
  });
});
