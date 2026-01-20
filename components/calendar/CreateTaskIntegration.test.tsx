// components/calendar/CreateTaskIntegration.test.tsx
// Phase 14.5: 통합 테스트 - 태스크 생성 후 캘린더 + FlowBoard refetch

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotionCalendar } from "./NotionCalendar";

// Mock hooks
const mockRefetch = vi.fn();
const mockCreateTask = vi.fn();

vi.mock("@/hooks/useTaskInstances", () => ({
  useTaskInstances: () => ({
    instances: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));

vi.mock("@/hooks/useCreateTask", () => ({
  useCreateTask: () => ({
    createTask: mockCreateTask,
  }),
}));

describe("CreateTask Integration - Refetch Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockResolvedValue({ success: true });
    mockCreateTask.mockResolvedValue({
      success: true,
      templateId: "template-123",
      stepIds: [],
      instanceId: "instance-456",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Calendar Refetch After Task Creation", () => {
    it("should call calendar refetch on successful task creation", async () => {
      const user = userEvent.setup();
      const mockOnTaskCreated = vi.fn();

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
          onTaskCreated={mockOnTaskCreated}
        />
      );

      // Open create dialog by clicking + button on day 20
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      const addButtonDay20 = addButtons.find(btn =>
        btn.getAttribute("aria-label")?.includes("20")
      );
      expect(addButtonDay20).toBeTruthy();
      await user.click(addButtonDay20!);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Fill in task name
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Integration Test Task");

      // Submit the form
      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      // Wait for creation to complete
      await waitFor(() => {
        // Calendar's refetch should be called
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("should call onTaskCreated callback on successful task creation", async () => {
      const user = userEvent.setup();
      const mockOnTaskCreated = vi.fn();

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
          onTaskCreated={mockOnTaskCreated}
        />
      );

      // Open create dialog
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Fill in task name
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      // Submit
      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      // Wait for onTaskCreated to be called (triggers FlowBoard refetch via parent)
      await waitFor(() => {
        expect(mockOnTaskCreated).toHaveBeenCalled();
      });
    });

    it("should call both refetch and onTaskCreated in correct order", async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      mockRefetch.mockImplementation(() => {
        callOrder.push("refetch");
        return Promise.resolve({ success: true });
      });

      const mockOnTaskCreated = vi.fn(() => {
        callOrder.push("onTaskCreated");
      });

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
          onTaskCreated={mockOnTaskCreated}
        />
      );

      // Open dialog and submit
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(callOrder).toEqual(["refetch", "onTaskCreated"]);
      });
    });
  });

  describe("Button Re-enable After Submission", () => {
    it("should disable submit button during submission", async () => {
      const user = userEvent.setup();

      // Make createTask take some time
      mockCreateTask.mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({
            success: true,
            templateId: "t1",
            stepIds: [],
            instanceId: "i1",
          }), 100)
        )
      );

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
        />
      );

      // Open dialog
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Fill name
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      // Submit
      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getAllByText("생성 중...").length).toBeGreaterThan(0);
      });
    });

    it("should close dialog after successful submission (button re-enabled for next use)", async () => {
      const user = userEvent.setup();

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
        />
      );

      // Open dialog
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Fill name and submit
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByText("새 태스크 만들기")).not.toBeInTheDocument();
      });

      // Open dialog again - button should be re-enabled
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Button should be disabled initially (name is empty)
      const newSubmitButtons = screen.getAllByText("태스크 생성");
      expect(newSubmitButtons[0].closest("button")).toBeDisabled();

      // Fill name - button should be enabled
      const newNameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(newNameInputs[0], "Another Task");

      await waitFor(() => {
        const enabledButtons = screen.getAllByText("태스크 생성");
        expect(enabledButtons[0].closest("button")).not.toBeDisabled();
      });
    });
  });

  describe("Failure Scenarios", () => {
    it("should not call refetch or onTaskCreated on failed creation", async () => {
      const user = userEvent.setup();
      const mockOnTaskCreated = vi.fn();

      mockCreateTask.mockResolvedValue({
        success: false,
        error: "API Error",
      });

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
          onTaskCreated={mockOnTaskCreated}
        />
      );

      // Open dialog
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Fill name and submit
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getAllByText("API Error").length).toBeGreaterThan(0);
      });

      // refetch and onTaskCreated should NOT have been called
      expect(mockRefetch).not.toHaveBeenCalled();
      expect(mockOnTaskCreated).not.toHaveBeenCalled();
    });

    it("should re-enable submit button after failed creation", async () => {
      const user = userEvent.setup();

      mockCreateTask.mockResolvedValue({
        success: false,
        error: "API Error",
      });

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
        />
      );

      // Open dialog
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Fill name and submit
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getAllByText("API Error").length).toBeGreaterThan(0);
      });

      // Button should be re-enabled after failure
      await waitFor(() => {
        const enabledButtons = screen.getAllByText("태스크 생성");
        expect(enabledButtons[0].closest("button")).not.toBeDisabled();
      });
    });

    it("should show retry option on partial failure", async () => {
      const user = userEvent.setup();

      mockCreateTask.mockResolvedValue({
        success: false,
        error: "Instance creation failed",
        cleanupIds: ["template-123"],
        partialCleanup: true,
      });

      render(
        <NotionCalendar
          selectedDate={new Date(2026, 0, 20)}
          onDateChange={() => {}}
        />
      );

      // Open dialog
      const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
      });

      // Fill name and submit
      const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
      await user.type(nameInputs[0], "Test Task");

      const submitButtons = screen.getAllByText("태스크 생성");
      await user.click(submitButtons[0]);

      // Should show partial failure UI with retry button
      await waitFor(() => {
        expect(screen.getAllByText("부분 생성 오류").length).toBeGreaterThan(0);
        expect(screen.getAllByText("다시 시도").length).toBeGreaterThan(0);
      });
    });
  });
});

describe("FlowBoard RefreshTrigger Behavior", () => {
  // These tests verify the FlowBoard responds to refreshTrigger prop changes
  // The actual FlowBoard component is tested separately
  // Here we test the integration contract: onTaskCreated should trigger parent state update

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockResolvedValue({ success: true });
    mockCreateTask.mockResolvedValue({
      success: true,
      templateId: "template-123",
      stepIds: [],
      instanceId: "instance-456",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should provide onTaskCreated callback to parent for FlowBoard sync", async () => {
    const user = userEvent.setup();
    const mockOnTaskCreated = vi.fn();

    render(
      <NotionCalendar
        selectedDate={new Date(2026, 0, 20)}
        onDateChange={() => {}}
        onTaskCreated={mockOnTaskCreated}
      />
    );

    // First task creation
    const addButtons = screen.getAllByRole("button", { name: /Add task for day/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
    });

    const nameInputs = screen.getAllByPlaceholderText(/아침 루틴/);
    await user.type(nameInputs[0], "Task 1");

    const submitButtons = screen.getAllByText("태스크 생성");
    await user.click(submitButtons[0]);

    // Wait for the first task creation to complete and trigger callback
    await waitFor(() => {
      expect(mockOnTaskCreated).toHaveBeenCalledTimes(1);
    });

    // Dialog should close after successful submission
    await waitFor(() => {
      expect(screen.queryByText("새 태스크 만들기")).not.toBeInTheDocument();
    });

    // Open dialog again for second task
    const addButtonsAgain = screen.getAllByRole("button", { name: /Add task for day/i });
    await user.click(addButtonsAgain[0]);

    await waitFor(() => {
      expect(screen.getAllByText("새 태스크 만들기").length).toBeGreaterThan(0);
    });

    const nameInputs2 = screen.getAllByPlaceholderText(/아침 루틴/);
    await user.type(nameInputs2[0], "Task 2");

    const submitButtons2 = screen.getAllByText("태스크 생성");
    await user.click(submitButtons2[0]);

    // Second creation should increment trigger again
    await waitFor(() => {
      expect(mockOnTaskCreated).toHaveBeenCalledTimes(2);
    });
  });
});
