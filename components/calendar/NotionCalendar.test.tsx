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

    const headers = screen.queryAllByText(new RegExp(monthLabel));
    expect(headers.length).toBeGreaterThan(0);
    expect(screen.getByText("notion connect success")).toBeInTheDocument();
    expect(screen.getByText("Phase 01: 01 — 15")).toBeInTheDocument();
    expect(screen.getByText("Phase 02: 16 — 31")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    expect(screen.getByTestId(`calendar-day-${today}`)).toHaveClass("border-black");
  });

  it("navigates to previous day when left arrow is clicked", () => {
    render(<NotionCalendar />);

    const leftArrows = screen.getAllByLabelText("Previous day");
    const todayButtons = screen.getAllByLabelText("Go to today");

    // Use first occurrence
    expect(todayButtons[0]).toHaveTextContent("Today");

    // Click previous day
    fireEvent.click(leftArrows[0]);

    // Should show a date instead of "Today"
    expect(todayButtons[0]).not.toHaveTextContent(/^Today$/);
  });

  it("navigates to next day when right arrow is clicked", () => {
    render(<NotionCalendar />);

    const rightArrows = screen.getAllByLabelText("Next day");
    const todayButtons = screen.getAllByLabelText("Go to today");

    const initialText = todayButtons[0].textContent;

    // Click next day
    fireEvent.click(rightArrows[0]);

    // Text should have changed
    expect(todayButtons[0].textContent).not.toBe(initialText);
  });

  it("resets to today when TODAY button is clicked", () => {
    render(<NotionCalendar />);

    const leftArrows = screen.getAllByLabelText("Previous day");
    const todayButtons = screen.getAllByLabelText("Go to today");

    // Navigate away
    fireEvent.click(leftArrows[0]);
    expect(todayButtons[0]).not.toHaveTextContent(/^Today$/);

    // Click TODAY button to reset
    fireEvent.click(todayButtons[0]);

    // Should show "Today" again
    expect(todayButtons[0]).toHaveTextContent("Today");
  });

  it("handles month boundary navigation without crashing", () => {
    render(<NotionCalendar />);

    const leftArrows = screen.getAllByLabelText("Previous day");
    const todayButtons = screen.getAllByLabelText("Go to today");

    // Navigate 40 days back (crossing month boundary)
    for (let i = 0; i < 40; i++) {
      fireEvent.click(leftArrows[0]);
    }

    // Should not crash
    expect(todayButtons[0]).toBeInTheDocument();
    expect(todayButtons[0]).not.toHaveTextContent(/^Today$/);

    // Should be able to return to today
    fireEvent.click(todayButtons[0]);
    expect(todayButtons[0]).toHaveTextContent("Today");
  });
});
