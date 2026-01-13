import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProgressIndicator } from "./ProgressIndicator";

describe("ProgressIndicator", () => {
  afterEach(() => {
    cleanup();
  });
  it('renders "Notion에서 완료 페이지 조회 중..." when phase is "fetch"', () => {
    render(<ProgressIndicator phase="fetch" />);
    expect(screen.getByText("Notion에서 완료 페이지 조회 중...")).toBeInTheDocument();
  });

  it('renders "키워드 정규화 중..." when phase is "normalize"', () => {
    render(<ProgressIndicator phase="normalize" />);
    expect(screen.getByText("키워드 정규화 중...")).toBeInTheDocument();
  });

  it('renders "클러스터링 중..." when phase is "cluster"', () => {
    render(<ProgressIndicator phase="cluster" />);
    expect(screen.getByText("클러스터링 중...")).toBeInTheDocument();
  });

  it('renders "완료" when phase is "done"', () => {
    render(<ProgressIndicator phase="done" />);
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  it("renders error message and retry button when phase is error", () => {
    const onRetry = vi.fn();
    render(<ProgressIndicator phase="error" error="테스트 에러" onRetry={onRetry} />);

    expect(screen.getByText("테스트 에러")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다시 시도/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ProgressIndicator phase="error" error="테스트 에러" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /다시 시도/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when phase is "idle"', () => {
    const { container } = render(<ProgressIndicator phase="idle" />);
    expect(container.firstChild).toBeNull();
  });
});
