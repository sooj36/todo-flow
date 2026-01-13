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
      <div className="flex flex-col gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="self-start px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle2 className="w-5 h-5 text-green-600" aria-label="완료" />
        <p className="text-green-700">{PHASE_MESSAGES[phase]}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-blue-700">{PHASE_MESSAGES[phase]}</p>
    </div>
  );
};
