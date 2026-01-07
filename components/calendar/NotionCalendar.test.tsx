import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotionCalendar } from "./NotionCalendar";

vi.mock("@/hooks/useTaskInstances", () => ({
  useTaskInstances: vi.fn(() => ({
    instances: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

describe("NotionCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current month header and phase sections", () => {
    const monthLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date());
    const today = new Date().getDate();

    render(<NotionCalendar />);

    expect(screen.getByText(`📅 ${monthLabel}`)).toBeInTheDocument();
    expect(screen.getByText("Connected to Notion")).toBeInTheDocument();
    expect(screen.getByText("Phase 01: 01 — 15")).toBeInTheDocument();
    expect(screen.getByText("Phase 02: 16 — 31")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    expect(screen.getByTestId(`calendar-day-${today}`)).toHaveClass("border-red-500");
  });
});
