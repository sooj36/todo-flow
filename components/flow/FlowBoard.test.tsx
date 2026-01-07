import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FlowBoard } from "./FlowBoard";

describe("FlowBoard", () => {
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
