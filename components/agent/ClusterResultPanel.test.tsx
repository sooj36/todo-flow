import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClusterResultPanel } from "./ClusterResultPanel";

describe("ClusterResultPanel", () => {
  afterEach(() => {
    cleanup();
  });

  const mockData = {
    meta: {
      totalPages: 5,
      totalKeywords: 25,
    },
    clusters: [
      {
        label: "UI/UX",
        keywords: ["디자인", "사용자 경험", "인터페이스"],
        pageRefs: [
          { pageId: "page1", title: "디자인 시스템 구축" },
          { pageId: "page2", title: "사용성 개선" },
        ],
      },
      {
        label: "Backend",
        keywords: ["API", "데이터베이스", "서버"],
        pageRefs: [
          { pageId: "page3", title: "API 설계" },
        ],
      },
    ],
    topKeywords: [
      { keyword: "디자인", count: 8 },
      { keyword: "API", count: 6 },
      { keyword: "성능", count: 5 },
    ],
  };

  it("renders meta information (total pages and keywords)", () => {
    render(<ClusterResultPanel data={mockData} />);

    expect(screen.getByText(/분석된 페이지:/)).toBeInTheDocument();
    expect(screen.getByText(/총 키워드:/)).toBeInTheDocument();
    // Use getAllByText since "개" appears in both meta items
    const items = screen.getAllByText(/\d+개/);
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it("renders all cluster labels", () => {
    render(<ClusterResultPanel data={mockData} />);

    expect(screen.getByText("UI/UX")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
  });

  it("renders keywords in each cluster", () => {
    render(<ClusterResultPanel data={mockData} />);

    // Use getAllByText since some keywords appear in multiple places
    expect(screen.getAllByText("디자인").length).toBeGreaterThan(0);
    expect(screen.getByText("사용자 경험")).toBeInTheDocument();
    expect(screen.getByText("인터페이스")).toBeInTheDocument();
    expect(screen.getAllByText("API").length).toBeGreaterThan(0);
  });

  it("renders page references with titles", () => {
    render(<ClusterResultPanel data={mockData} />);

    expect(screen.getByText(/디자인 시스템 구축/)).toBeInTheDocument();
    expect(screen.getByText(/사용성 개선/)).toBeInTheDocument();
    expect(screen.getByText(/API 설계/)).toBeInTheDocument();
  });

  it("renders top keywords with counts", () => {
    render(<ClusterResultPanel data={mockData} />);

    expect(screen.getByText("빈도 높은 키워드")).toBeInTheDocument();
    expect(screen.getByText("(8)")).toBeInTheDocument();
    expect(screen.getByText("(6)")).toBeInTheDocument();
    expect(screen.getByText("(5)")).toBeInTheDocument();
  });

  it("toggles cluster visibility when clicked", async () => {
    const user = userEvent.setup();
    render(<ClusterResultPanel data={mockData} />);

    // Initially, unique keyword "사용자 경험" should be visible
    expect(screen.getByText("사용자 경험")).toBeInTheDocument();

    // Click to collapse
    const uiUxHeader = screen.getByText("UI/UX");
    await user.click(uiUxHeader);

    // Keywords should be hidden
    expect(screen.queryByText("사용자 경험")).not.toBeInTheDocument();

    // Click again to expand
    await user.click(uiUxHeader);

    // Keywords should be visible again
    expect(screen.getByText("사용자 경험")).toBeInTheDocument();
  });
});
