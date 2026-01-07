import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlowBoard } from "./FlowBoard";

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

  it("renders the disconnected state", () => {
    render(<FlowBoard />);

    expect(screen.getByText("Daily Automation Flow")).toBeInTheDocument();
    expect(screen.getByText("Notion not connected")).toBeInTheDocument();

    const connectButton = screen.getByRole("button", {
      name: /connect notion/i,
    });
    expect(connectButton).toBeDisabled();

    expect(screen.getByText("DATABASE ID: —")).toBeInTheDocument();
    expect(screen.getByText("Auto-save disabled until connected")).toBeInTheDocument();
  });
});
