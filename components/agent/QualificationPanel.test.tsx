import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QualificationPanel } from "./QualificationPanel";

describe("QualificationPanel", () => {
  it("renders title and bullets", () => {
    render(
      <QualificationPanel
        data={{
          pageId: "page-1",
          title: "뱅크샐러드",
          source: { from: "toggle", rawLength: 120 },
          summary: {
            bullets: ["조건1", "조건2"],
            model: "gemini-2.0-flash-exp",
            tokenLimit: 120,
          },
        }}
      />
    );

    expect(screen.getByText("뱅크샐러드")).toBeInTheDocument();
    expect(screen.getByText("조건1")).toBeInTheDocument();
    expect(screen.getByText("조건2")).toBeInTheDocument();
    expect(screen.getByText(/프로젝트 DB/)).toBeInTheDocument();
  });
});
