import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotionConnectionModal } from "./NotionConnectionModal";

describe("NotionConnectionModal", () => {
  it("prefills initial values and calls onSave", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const initialValues = {
      apiKey: "secret_test_key",
      templateDbId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      stepDbId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      instanceDbId: "cccccccccccccccccccccccccccccccc",
    };

    render(
      <NotionConnectionModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        initialValues={initialValues}
      />
    );

    expect(screen.getByLabelText(/notion api key/i)).toHaveValue("secret_test_key");
    expect(screen.getByLabelText(/template db id/i)).toHaveValue(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );

    fireEvent.click(screen.getByRole("button", { name: /save connection/i }));

    expect(onSave).toHaveBeenCalledWith(initialValues);
    expect(onClose).toHaveBeenCalled();
  });
});
