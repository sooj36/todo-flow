import { useCallback } from "react";
import type { CreateTaskFormData, CreateTaskResult } from "@/components/calendar/CreateTaskDialog";

export const useCreateTask = () => {
  const createTask = useCallback(async (data: CreateTaskFormData): Promise<CreateTaskResult> => {
    try {
      const response = await fetch("/api/notion/create-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle partial failure with cleanup info
        if (result.cleanupIds || result.partialCleanup !== undefined) {
          return {
            success: false,
            cleanupIds: result.cleanupIds || [],
            partialCleanup: result.partialCleanup || false,
            error: result.error || result.message || "태스크 생성 중 오류가 발생했습니다.",
          };
        }

        return {
          success: false,
          error: result.error || result.message || "태스크 생성에 실패했습니다.",
        };
      }

      return {
        success: true,
        templateId: result.templateId,
        stepIds: result.stepIds,
        instanceId: result.instanceId,
        cleanupIds: result.cleanupIds,
        partialCleanup: result.partialCleanup,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.",
      };
    }
  }, []);

  return { createTask };
};
