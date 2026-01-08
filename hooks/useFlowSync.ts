import { useState, useRef, useCallback, useEffect } from "react";

interface UseFlowSyncProps {
  refetchInstances: () => Promise<{ success: boolean; error?: string }>;
  refetchTemplates: () => Promise<{ success: boolean; error?: string }>;
}

export function useFlowSync({ refetchInstances, refetchTemplates }: UseFlowSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>("");
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSync = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    setIsSyncing(true);
    setSyncSuccess(false);
    setSyncError(false);
    setSyncErrorMessage("");

    const [instancesResult, templatesResult] = await Promise.all([
      refetchInstances(),
      refetchTemplates(),
    ]);

    setIsSyncing(false);

    const hasError = !instancesResult.success || !templatesResult.success;
    if (hasError) {
      const errorMsg = instancesResult.error || templatesResult.error || "Sync failed";
      setSyncError(true);
      setSyncErrorMessage(errorMsg);
      // Reset error state after 5 seconds
      syncTimeoutRef.current = setTimeout(() => {
        setSyncError(false);
        setSyncErrorMessage("");
      }, 5000);
    } else {
      setSyncSuccess(true);
      // Reset success state after 5 seconds
      syncTimeoutRef.current = setTimeout(() => setSyncSuccess(false), 5000);
    }
  }, [refetchInstances, refetchTemplates]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSyncing,
    syncSuccess,
    syncError,
    syncErrorMessage,
    handleSync,
    syncTimeoutRef,
  };
}
