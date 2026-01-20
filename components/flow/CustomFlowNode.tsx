import React from "react";
import {
  CheckCircle2,
  Loader2,
  MoreVertical,
  Database,
  ArrowRight,
} from "lucide-react";
import { Handle, Position } from "reactflow";

// Custom Node Data interface for React Flow
export interface CustomNodeData {
  title: string;
  icon: React.ReactNode;
  status: "idle" | "running" | "success" | "error";
  type: string;
  description?: string;
  tasks?: Array<{
    id: string;
    name: string;
    done: boolean;
    isUpdating?: boolean;
  }>;
  progress?: {
    done: number;
    total: number;
    percent: number;
  };
  isSyncable?: boolean;
  syncState?: "idle" | "loading" | "success";
  onToggleFlowStep?: (stepId: string, nextDone: boolean, previousDone: boolean) => void;
}

export const CustomFlowNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  const {
    title,
    icon,
    status,
    type,
    description,
    tasks,
    progress,
    isSyncable,
    syncState,
    onToggleFlowStep,
  } = data;

  const statusColors = {
    idle: "bg-gray-100 border-gray-200",
    running: "bg-blue-50 border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
  };

  const statusIndicators = {
    idle: "bg-gray-300",
    running: "bg-blue-500 animate-pulse",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div
      className={`w-[220px] border rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:shadow-md ${statusColors[status]
        }`}
    >
      {/* Target handle (left side) for incoming connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3b82f6' }}
      />

      {/* Source handle (right side) for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#3b82f6' }}
      />

      <div className="p-2 border-b flex items-center justify-between bg-white/50">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${statusIndicators[status]}`}
          ></span>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
            {type}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isSyncable && syncState === "success" && (
            <CheckCircle2 size={12} className="text-green-500" />
          )}
          {isSyncable && syncState === "loading" && (
            <Loader2 size={12} className="text-blue-500 animate-spin" />
          )}
          <MoreVertical size={12} className="text-gray-300 cursor-pointer" />
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-white border border-gray-100 rounded shadow-sm">
            {icon}
          </div>
          <h3 className="text-xs font-bold text-gray-700 truncate">
            {title}
          </h3>
        </div>

        {description && (
          <p className="text-[10px] text-gray-400 leading-tight italic">
            {description}
          </p>
        )}

        {tasks && tasks.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {tasks.map((task) => {
              const isDisabled = !onToggleFlowStep || task.isUpdating;
              return (
                <label key={task.id} className="flex items-start gap-2 group cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3 w-3 rounded-sm border border-gray-300 text-blue-600 focus:ring-0 group-hover:border-blue-400"
                    checked={task.done}
                    onChange={() => onToggleFlowStep?.(task.id, !task.done, task.done)}
                    disabled={isDisabled}
                    aria-label={`${task.name} 완료`}
                  />
                  <span
                    className={`text-[10px] leading-tight flex-1 ${task.done ? "text-gray-400 line-through" : "text-gray-500"
                      }`}
                  >
                    {task.name}
                  </span>
                  {task.isUpdating && (
                    <Loader2 size={10} className="text-blue-500 animate-spin mt-0.5" />
                  )}
                </label>
              );
            })}
          </div>
        )}

        {isSyncable && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
            <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
              <Database size={10} />
              {syncState === "success" ? "Saved to Notion" : "Pending Sync"}
            </span>
            {syncState === "success" && (
              <ArrowRight size={10} className="text-gray-300" />
            )}
          </div>
        )}

        {progress && progress.total > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-1.5" data-testid="flow-progress">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
              <span>Progress</span>
              <span>{progress.done}/{progress.total}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-500 transition-all"
                style={{ width: `${progress.percent}%` }}
                data-testid="flow-progress-bar"
              />
            </div>
            <div className="text-[9px] text-gray-400 text-right font-bold" data-testid="flow-progress-percent">
              {progress.percent}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
