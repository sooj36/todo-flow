import React from "react";
import { CheckCircle2 } from "lucide-react";

const PHASE_MESSAGES = {
  idle: "",
  fetch: "Notion에서 완료 페이지 조회 중...",
  normalize: "키워드 정규화 중...",
  cluster: "클러스터링 중...",
  done: "완료",
  error: "",
} as const;

export type Phase = keyof typeof PHASE_MESSAGES;

interface ProgressIndicatorProps {
  phase: Phase;
  error?: string;
  onRetry?: () => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  phase,
  error,
  onRetry,
}) => {
  if (phase === "idle") {
    return null;
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-2 p-4 bg-[#ffecec] border border-[#ffc2c2] rounded-2xl shadow-sm">
        <p className="text-red-700 font-medium">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="self-start px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex items-center gap-2 p-4 bg-[#e7f8f1] border border-[#b6efd6] rounded-2xl shadow-sm">
        <CheckCircle2 className="w-5 h-5 text-[#0d8f5b]" role="img" aria-label="완료" />
        <p className="text-[#0d8f5b] font-semibold">{PHASE_MESSAGES[phase]}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-[#f0edff] border border-[#dcd6ff] rounded-2xl shadow-sm">
      <div className="w-4 h-4 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
      <p className="text-primary font-medium">{PHASE_MESSAGES[phase]}</p>
    </div>
  );
};
