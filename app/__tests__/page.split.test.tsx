import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/components/calendar/NotionCalendar", () => ({
  NotionCalendar: () => <div data-testid="mock-calendar" />,
}));

vi.mock("@/components/flow/FlowBoard", () => ({
  FlowBoard: () => <div data-testid="mock-flow-board" />,
}));

vi.mock("@/components/layout/Sidebar", () => ({
  Sidebar: () => <div data-testid="mock-sidebar" />,
}));

vi.mock("@/components/agent/SearchBar", () => ({
  SearchBar: () => <div data-testid="mock-search" />,
}));

vi.mock("@/components/agent/ProgressIndicator", () => ({
  ProgressIndicator: () => <div data-testid="mock-progress" />,
}));

vi.mock("@/components/agent/QualificationPanel", () => ({
  QualificationPanel: () => <div data-testid="mock-qualification" />,
}));

vi.mock("@/lib/hooks/useAgentQuery", () => ({
  useAgentQuery: () => ({
    phase: "idle",
    data: null,
    error: null,
    executeQuery: vi.fn(),
    retry: vi.fn(),
  }),
}));

import Home from "@/app/page";

describe("Split View Layout", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("enforces minimum widths on split panels", () => {
    render(<Home />);

    const calendarPanel = screen.getByTestId("calendar-panel");
    const flowPanel = screen.getByTestId("flow-panel");

    expect(calendarPanel).toHaveClass("min-w-[320px]");
    expect(flowPanel).toHaveClass("min-w-[320px]");
  });
});
