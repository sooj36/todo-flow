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
  handleSync: () => void;
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
    <div className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-[#ececeb] z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded flex items-center justify-center">
          <Zap size={18} fill="currentColor" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#37352f]">
            Daily Automation Flow
          </h2>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <Loader2 size={12} className="animate-spin" />
                Loading...
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase tracking-wider">
                <AlertCircle size={12} />
                Connection error
              </span>
            )}
            {!loading && !error && (
              <span
                className={`flex items-center gap-1 text-[10px] font-bold tracking-wide ${isConnected
                  ? "rounded-full bg-green-100 px-2 py-0.5 text-green-700"
                  : "text-gray-400"
                  }`}
              >
                <span className={`w-1.5 h-1.5 ${isConnected ? 'bg-green-500' : 'bg-gray-300'} rounded-full`}></span>
                {isConnected ? 'notion connect success' : 'Notion not connected'}
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

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold ${isConnected
            ? "bg-green-100 text-green-700"
            : "bg-gray-200 text-gray-600"
            }`}
        >
          <Play size={14} fill="currentColor" />
          {isConnected ? "notion connect success" : "Configure .env.local"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={!isConnected || isSyncing}
            className={`p-2 border border-[#ececeb] rounded-md transition-all ${syncSuccess
              ? "bg-green-100 text-green-600"
              : syncError
                ? "bg-red-100 text-red-600"
                : "bg-white text-[#37352f]/60 hover:text-[#37352f]"
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
        <button className="p-2 bg-white border border-[#ececeb] rounded-md text-[#37352f]/60 hover:text-[#37352f] transition-all">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
