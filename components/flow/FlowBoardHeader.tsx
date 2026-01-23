import React from "react";
import {
  Play,
  Plus,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface FlowBoardHeaderProps {
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  isSyncing: boolean;
  syncSuccess: boolean;
  syncError: boolean;
  syncErrorMessage: string;
  handleSync: () => Promise<void>;
}

export const FlowBoardHeader: React.FC<FlowBoardHeaderProps> = ({
  loading,
  error,
  isConnected,
  isSyncing,
  syncSuccess,
  syncError,
  syncErrorMessage,
  handleSync,
}) => {
  return (
    <div className="p-5 flex items-center justify-between bg-[#e8dcc8] border-b border-[#e6e2f3] z-20">
      {/* flow 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#7bcf9a] to-[#3ba46b] text-white rounded-2xl flex items-center justify-center shadow-md">
          <Zap size={18} fill="currentColor" className="drop-shadow-sm" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-primary">
            Daily Automation Flow
          </h2>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="flex items-center gap-1 text-[11px] text-secondary font-semibold tracking-wide">
                <Loader2 size={14} className="animate-spin" />
                Loading...
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-semibold tracking-wide">
                <AlertCircle size={14} />
                Connection error
              </span>
            )}
            {!loading && !error && (
              <span
                className={`flex items-center gap-1 text-[11px] font-semibold tracking-wide ${
                  isConnected
                    ? "rounded-full bg-[#e7f8f1] px-2.5 py-1 text-[#0d8f5b] shadow-sm"
                    : "text-secondary"
                }`}
              >
                <span className={`w-1.5 h-1.5 ${isConnected ? 'bg-[#10b981]' : 'bg-gray-300'} rounded-full`}></span>
                {isConnected ? 'Notion connected' : 'Notion not connected'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Aria-live region for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {isSyncing && "Syncing with Notion..."}
          {syncSuccess && "Sync completed successfully"}
          {syncError && syncErrorMessage && `Sync failed: ${syncErrorMessage}`}
        </div>


        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={!isConnected || isSyncing}
            className={`p-2.5 border border-[#e6e2f3] rounded-full transition-all ${syncSuccess
              ? "bg-[#e7f8f1] text-[#0d8f5b]"
              : syncError
                ? "bg-[#ffecec] text-red-600"
                : "bg-white/80 text-secondary hover:text-primary shadow-sm"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={syncError && syncErrorMessage ? `Sync failed: ${syncErrorMessage}` : "Sync with Notion"}
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
          </button>
          {syncError && syncErrorMessage && (
            <span className="text-xs text-red-600 font-medium max-w-xs truncate" title={syncErrorMessage}>
              {syncErrorMessage}
            </span>
          )}
        </div>
        <button className="p-2.5 bg-white/80 border border-[#e6e2f3] rounded-full text-secondary hover:text-primary transition-all shadow-sm">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
