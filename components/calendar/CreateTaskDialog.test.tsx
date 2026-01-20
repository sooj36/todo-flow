import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTaskDialog } from "./CreateTaskDialog";

const mockOnClose = vi.fn();
const mockOnSubmit = vi.fn();
const mockOnSuccess = vi.fn();

const defaultProps = {
  isOpen: true,
  selectedDate: new Date(2026, 0, 20),
  onClose: mockOnClose,
  onSubmit: mockOnSubmit,
  onSuccess: mockOnSuccess,
};

describe("CreateTaskDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue({ success: true, templateId: "t1", stepIds: [], instanceId: "i1" });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<CreateTaskDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("새 태스크 만들기")).not.toBeInTheDocument();
    });

    it("should render dialog when open", () => {
      render(<CreateTaskDialog {...defaultProps} />);
      expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
    });

    it("should render date label", () => {
      render(<CreateTaskDialog {...defaultProps} />);
      expect(screen.getAllByText("2026년 1월 20일").length).toBeGreaterThan(0);
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when name is empty", () => {
      render(<CreateTaskDialog {...defaultProps} />);
      const submitButtons = screen.getAllByText("태스크 생성");
      expect(submitButtons[0].closest("button")).toBeDisabled();
    });

    it("should enable submit button when name is filled", async () => {
      const user = userEvent.setup();
      render(<CreateTaskDialog {...defaultProps} />);

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      await waitFor(() => {
        const submitButtons = screen.getAllByText("태스크 생성");
        expect(submitButtons[0].closest("button")).not.toBeDisabled();
      });
    });
  });

  describe("Submission", () => {
    it("should show loading state while submitting", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {}));

      render(<CreateTaskDialog {...defaultProps} />);

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("생성 중...").length).toBeGreaterThan(0);
      });
    });

    it("should call onSuccess and onClose on successful submit", async () => {
      const user = userEvent.setup();
      render(<CreateTaskDialog {...defaultProps} />);

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should show error message on failed submit", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: false, error: "Server error" });

      render(<CreateTaskDialog {...defaultProps} />);

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("Server error").length).toBeGreaterThan(0);
      });
    });

    it("should prevent multiple submissions", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {}));

      render(<CreateTaskDialog {...defaultProps} />);

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);
      await user.click(submitButtons[0]);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Partial Failure", () => {
    it("should show partial failure message", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({
        success: false,
        error: "Instance creation failed",
        cleanupIds: ["id1", "id2"],
        partialCleanup: true,
      });

      render(<CreateTaskDialog {...defaultProps} />);

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("부분 생성 오류").length).toBeGreaterThan(0);
      });
    });

    it("should show retry button on partial failure", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({
        success: false,
        error: "Failed",
        cleanupIds: ["id1"],
        partialCleanup: true,
      });

      render(<CreateTaskDialog {...defaultProps} />);

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("다시 시도").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Dialog Interactions", () => {
    it("should close on Escape key when not submitting", () => {
      render(<CreateTaskDialog {...defaultProps} />);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Repeat Options Validation", () => {
    it("should require weekdays when custom frequency is selected", async () => {
      const user = userEvent.setup();
      render(<CreateTaskDialog {...defaultProps} />);

      // Fill required name
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      // Enable repeat
      const toggleButtons = screen.getAllByRole("button");
      const toggle = toggleButtons.find(btn =>
        btn.classList.contains("bg-gray-300") || btn.classList.contains("bg-blue-500")
      );
      if (toggle) await user.click(toggle);

      // Select custom frequency
      await waitFor(() => {
        expect(screen.getAllByText("사용자 지정").length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByText("사용자 지정")[0]);

      // Submit should be disabled without weekdays
      await waitFor(() => {
        const submitButtons = screen.getAllByText("태스크 생성");
        expect(submitButtons[0].closest("button")).toBeDisabled();
      });
    });

    it("should enable submit when weekday is selected for custom frequency", async () => {
      const user = userEvent.setup();
      render(<CreateTaskDialog {...defaultProps} />);

      // Fill required name
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      // Enable repeat
      const toggleButtons = screen.getAllByRole("button");
      const toggle = toggleButtons.find(btn =>
        btn.classList.contains("bg-gray-300") || btn.classList.contains("bg-blue-500")
      );
      if (toggle) await user.click(toggle);

      // Select custom frequency
      await waitFor(() => {
        expect(screen.getAllByText("사용자 지정").length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByText("사용자 지정")[0]);

      // Select a weekday
      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: "월" }).length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByRole("button", { name: "월" })[0]);

      // Submit should be enabled
      await waitFor(() => {
        const submitButtons = screen.getAllByText("태스크 생성");
        expect(submitButtons[0].closest("button")).not.toBeDisabled();
      });
    });

    it("should accept valid repeatLimit within bounds (1-365)", async () => {
      const user = userEvent.setup();
      render(<CreateTaskDialog {...defaultProps} />);

      // Fill required name
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      // Enable repeat
      const toggleButtons = screen.getAllByRole("button");
      const toggle = toggleButtons.find(btn =>
        btn.classList.contains("bg-gray-300") || btn.classList.contains("bg-blue-500")
      );
      if (toggle) await user.click(toggle);

      // Enter valid repeatLimit
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText("최대 365").length).toBeGreaterThan(0);
      });
      const limitInputs = screen.getAllByPlaceholderText("최대 365");
      await user.type(limitInputs[0], "30");

      // Submit should be enabled
      await waitFor(() => {
        const submitButtons = screen.getAllByText("태스크 생성");
        expect(submitButtons[0].closest("button")).not.toBeDisabled();
      });
    });
  });

  describe("Step Validation", () => {
    it("should show step count and allow adding steps", async () => {
      const user = userEvent.setup();
      render(<CreateTaskDialog {...defaultProps} />);

      // Initial state: 0/20
      expect(screen.getAllByText("플로우 스텝 (0/20)").length).toBeGreaterThan(0);

      // Add a step
      const stepInput = screen.getAllByPlaceholderText("새 스텝 이름")[0];
      await user.type(stepInput, "First Step");
      await user.keyboard("{Enter}");

      // Count should update to 1/20
      await waitFor(() => {
        expect(screen.getAllByText("플로우 스텝 (1/20)").length).toBeGreaterThan(0);
      });

      // Add another step
      await user.type(stepInput, "Second Step");
      await user.keyboard("{Enter}");

      // Count should update to 2/20
      await waitFor(() => {
        expect(screen.getAllByText("플로우 스텝 (2/20)").length).toBeGreaterThan(0);
      });
    });

    it("should add and remove steps correctly", async () => {
      const user = userEvent.setup();
      render(<CreateTaskDialog {...defaultProps} />);

      const stepInput = screen.getAllByPlaceholderText("새 스텝 이름")[0];

      // Add a step
      await user.type(stepInput, "Test Step");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getAllByText("Test Step").length).toBeGreaterThan(0);
        expect(screen.getAllByText("플로우 스텝 (1/20)").length).toBeGreaterThan(0);
      });

      // Remove the step
      const removeButtons = screen.getAllByLabelText(/Remove step/);
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText("Test Step")).not.toBeInTheDocument();
        expect(screen.getAllByText("플로우 스텝 (0/20)").length).toBeGreaterThan(0);
      });
    });
  });
});
