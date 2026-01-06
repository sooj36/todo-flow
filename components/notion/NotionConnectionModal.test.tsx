import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NotionConnectionModal } from "./NotionConnectionModal";

describe("NotionConnectionModal", () => {
  it("enables save when all inputs are valid", () => {
    render(<NotionConnectionModal isOpen onClose={() => {}} />);

    const saveButton = screen.getByRole("button", { name: /save connection/i });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/notion api key/i), {
      target: { value: "secret_1234567890abcdef" },
    });
    fireEvent.change(screen.getByLabelText(/template db id/i), {
      target: { value: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    });
    fireEvent.change(screen.getByLabelText(/step db id/i), {
      target: { value: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    });
    fireEvent.change(screen.getByLabelText(/instance db id/i), {
      target: { value: "cccccccccccccccccccccccccccccccc" },
    });

    expect(saveButton).toBeEnabled();
  });

  it("shows validation help for an invalid api key after blur", () => {
    render(<NotionConnectionModal isOpen onClose={() => {}} />);

    const apiKeyInput = screen.getByLabelText(/notion api key/i);
    fireEvent.change(apiKeyInput, { target: { value: "invalid" } });
    fireEvent.blur(apiKeyInput);

    expect(
      screen.getByText(/api key must start with secret_ or ntn_/i)
    ).toBeInTheDocument();
  });
});
