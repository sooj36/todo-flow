import { useState, useRef, useCallback, useEffect } from "react";
import type { MutableRefObject } from "react";
import { TaskTemplate } from "@/types";

interface UseFlowStepsProps {
  templates: TaskTemplate[];
  syncTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  setSyncError: (value: boolean) => void;
  setSyncSuccess: (value: boolean) => void;
  setSyncErrorMessage: (value: string) => void;
}

export function useFlowSteps({
  templates,
  syncTimeoutRef,
  setSyncError,
  setSyncSuccess,
  setSyncErrorMessage,
}: UseFlowStepsProps) {
  const [stepOverrides, setStepOverrides] = useState<Record<string, boolean>>({});
  const [stepUpdating, setStepUpdating] = useState<Record<string, boolean>>({});
  const stepUpdatingRef = useRef<Record<string, boolean>>({});

  const handleToggleFlowStep = useCallback(async (
    stepId: string,
    nextDone: boolean,
    previousDone: boolean
  ) => {
    // Prevent duplicate toggles (race condition protection)
    if (stepUpdatingRef.current[stepId]) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    // Optimistic update: update both ref and state
    stepUpdatingRef.current[stepId] = true;
    setStepUpdating((prev) => ({ ...prev, [stepId]: true }));
    setStepOverrides((prev) => ({ ...prev, [stepId]: nextDone }));

    try {
      const response = await fetch(`/api/notion/flow-steps/${stepId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ done: nextDone }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync flow step");
      }
    } catch (err) {
      // Rollback on failure
      setStepOverrides((prev) => ({ ...prev, [stepId]: previousDone }));
      setSyncError(true);
      setSyncSuccess(false);
      setSyncErrorMessage(
        err instanceof Error ? err.message : "Failed to sync flow step"
      );
      // Reset error state after 5 seconds
      syncTimeoutRef.current = setTimeout(() => {
        setSyncError(false);
        setSyncErrorMessage("");
      }, 5000);
    } finally {
      stepUpdatingRef.current[stepId] = false;
      setStepUpdating((prev) => ({ ...prev, [stepId]: false }));
    }
  }, [syncTimeoutRef, setSyncError, setSyncSuccess, setSyncErrorMessage]);

  // Reset step overrides when templates change
  useEffect(() => {
    setStepOverrides({});
    setStepUpdating({});
    stepUpdatingRef.current = {};
  }, [templates]);

  return {
    stepOverrides,
    stepUpdating,
    handleToggleFlowStep,
  };
}
