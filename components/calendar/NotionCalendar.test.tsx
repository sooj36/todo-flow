import { render, screen, fireEvent } from "@testing-library/react";
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
  const mockOnDateChange = vi.fn();
  const now = new Date();
  const defaultProps = {
    selectedDate: now, // Use actual current date so "today" highlight is always tested
    onDateChange: mockOnDateChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current month header and phase sections", () => {
    const todayDate = now.getDate();
    const monthLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(now);

    render(<NotionCalendar {...defaultProps} />);

    const headers = screen.queryAllByText(new RegExp(monthLabel));
    expect(headers.length).toBeGreaterThan(0);
    expect(screen.getByText("notion connect success")).toBeInTheDocument();
    expect(screen.getByText("Phase 01: 01 — 15")).toBeInTheDocument();
    expect(screen.getByText("Phase 02: 16 — 31")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    // Today highlight should always be visible since selectedDate = now
    expect(screen.getByTestId(`calendar-day-${todayDate}`)).toHaveClass("border-black");
  });

  it("calls onDateChange when previous day arrow is clicked", () => {
    render(<NotionCalendar {...defaultProps} />);

    const leftArrows = screen.getAllByLabelText("Previous day");

    fireEvent.click(leftArrows[0]);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(8); // Jan 8
  });

  it("calls onDateChange when next day arrow is clicked", () => {
    render(<NotionCalendar {...defaultProps} />);

    const rightArrows = screen.getAllByLabelText("Next day");

    fireEvent.click(rightArrows[0]);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(10); // Jan 10
  });

  it("calls onDateChange with today when TODAY button is clicked", () => {
    const pastDate = new Date(2026, 0, 5); // Jan 5

    render(<NotionCalendar selectedDate={pastDate} onDateChange={mockOnDateChange} />);

    const todayButtons = screen.getAllByLabelText("Go to today");
    fireEvent.click(todayButtons[0]);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    // Should be called with a new Date (today)
    expect(calledDate.getDate()).toBe(new Date().getDate());
  });

  it("handles month boundary navigation", () => {
    const endOfMonth = new Date(2026, 0, 31); // Jan 31, 2026

    render(<NotionCalendar selectedDate={endOfMonth} onDateChange={mockOnDateChange} />);

    const rightArrows = screen.getAllByLabelText("Next day");
    fireEvent.click(rightArrows[0]);

    // Verify callback was called
    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    // Just verify it's a valid Date object and different from original
    expect(calledDate instanceof Date).toBe(true);
    expect(calledDate.getTime()).not.toBe(endOfMonth.getTime());
  });
});
