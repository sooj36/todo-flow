import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

  // Fix time to a known date for deterministic tests
  const FIXED_DATE = new Date(2026, 0, 15, 12, 0, 0); // Jan 15, 2026, 12:00:00

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  const defaultProps = {
    selectedDate: new Date(FIXED_DATE), // Use fixed date
    onDateChange: mockOnDateChange,
  };

  it("renders the current month header and phase sections", () => {
    const todayDate = FIXED_DATE.getDate(); // 15
    const monthLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(FIXED_DATE);

    render(<NotionCalendar {...defaultProps} />);

    const headers = screen.queryAllByText(new RegExp(monthLabel));
    expect(headers.length).toBeGreaterThan(0);
    expect(screen.getByText("Notion connected")).toBeInTheDocument();
    expect(screen.getByText("Phase 01: 01 — 15")).toBeInTheDocument();
    expect(screen.getByText("Phase 02: 16 — 31")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    // Selected day (today) should have selected styling
    expect(screen.getByTestId(`calendar-day-${todayDate}`)).toHaveClass("border-[#6c5ce7]");
  });

  it("marks header elements for compact layout handling", () => {
    render(<NotionCalendar {...defaultProps} />);

    const header = screen.getByTestId("calendar-header");
    expect(header).toHaveClass("flex-wrap");

    const subtext = screen.getByText("Bi-weekly cadence with synced Notion tasks");
    expect(subtext).toHaveClass("calendar-subtext");

    const connection = screen.getByText("Notion connected");
    expect(connection).toHaveClass("calendar-connection-text");
  });

  it("calls onDateChange when previous day arrow is clicked", () => {
    render(<NotionCalendar {...defaultProps} />);

    const leftArrows = screen.getAllByLabelText("Previous day");

    fireEvent.click(leftArrows[0]);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(14); // Jan 14
  });

  it("calls onDateChange when next day arrow is clicked", () => {
    render(<NotionCalendar {...defaultProps} />);

    const rightArrows = screen.getAllByLabelText("Next day");

    fireEvent.click(rightArrows[0]);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(16); // Jan 16
  });

  it("calls onDateChange with today when TODAY button is clicked", () => {
    const pastDate = new Date(2026, 0, 5); // Jan 5

    render(<NotionCalendar selectedDate={pastDate} onDateChange={mockOnDateChange} />);

    const todayButtons = screen.getAllByLabelText("Go to today");
    fireEvent.click(todayButtons[0]);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    // Should be called with new Date() which is FIXED_DATE (Jan 15)
    expect(calledDate.getDate()).toBe(15);
    expect(calledDate.getMonth()).toBe(0); // January
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

  it("highlights selected date and shows today dot when different", () => {
    // FIXED_DATE is Jan 15 (Today)
    const jan8 = new Date(2026, 0, 8);

    render(<NotionCalendar selectedDate={jan8} onDateChange={mockOnDateChange} />);

    const day8 = screen.getByTestId("calendar-day-8");
    const day15 = screen.getByTestId("calendar-day-15");

    // Day 8 (Selected) should have bold border
    expect(day8).toHaveClass("border-2");
    expect(day8).toHaveClass("border-[#6c5ce7]");
    expect(day8).toHaveClass("bg-[#ede9ff]");

    // Day 15 (Today) should have subtle green border and a green dot
    expect(day15).toHaveClass("border-2");
    expect(day15).toHaveClass("border-[#0d8f5b]");

    // Check for the green dot indicator inside day 15
    const dot = day15.querySelector('[class*="bg-[#0d8f5b]"]');
    expect(dot).toBeInTheDocument();
  });

  it("calls onDateChange when a calendar day cell is clicked", () => {
    render(<NotionCalendar {...defaultProps} />);

    // Click day 10
    const day10 = screen.getByTestId("calendar-day-10");
    fireEvent.click(day10);

    expect(mockOnDateChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(10);
    expect(calledDate.getMonth()).toBe(0); // Jan (0-based)
    expect(calledDate.getFullYear()).toBe(2026);
  });
});
