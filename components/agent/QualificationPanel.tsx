import React from "react";
import type { ProjectSummary } from "@/lib/agent/schema";

interface QualificationPanelProps {
  data: ProjectSummary;
}

export const QualificationPanel: React.FC<QualificationPanelProps> = ({ data }) => {
  const sourceLabel =
    data.source.from === "toggle"
      ? "공고 토글 기반 요약"
      : data.source.from === "page"
        ? "페이지 본문 기반 요약"
        : "요약 필드 기반 요약";

  return (
    <div className="flex flex-col gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="text-sm text-gray-500">
        프로젝트 DB · {sourceLabel}
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
        <span className="text-xs text-gray-500">
          {data.summary.model} · {data.summary.tokenLimit} tokens 이내
        </span>
      </div>
      <ul className="list-disc pl-5 space-y-2 text-gray-800">
        {data.summary.bullets.map((bullet, idx) => (
          <li key={idx} className="leading-6">
            {bullet}
          </li>
        ))}
      </ul>
      <div className="text-xs text-gray-500">
        원문 길이: {data.source.rawLength ?? "알 수 없음"} chars
      </div>
    </div>
  );
};
