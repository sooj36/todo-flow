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

  // Determine styles based on node type
  const getTypeStyles = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("trigger")) {
      return {
        container: "bg-cinnamon/5 border-cinnamon/40 hover:shadow-[0_15px_40px_rgba(233,193,109,0.2)]",
        dot: "bg-cinnamon",
        badge: "text-cinnamon bg-cinnamon/10",
        handle: "#E9C16D",
        checkbox: "text-cinnamon border-cinnamon/40 group-hover:border-cinnamon",
        loader: "text-cinnamon",
        progress: "from-cinnamon to-[#ffe082]",
      };
    }
    if (t.includes("agent")) {
      return {
        container: "bg-darkviolet/5 border-darkviolet/40 hover:shadow-[0_15px_40px_rgba(88,65,126,0.2)]",
        dot: "bg-darkviolet",
        badge: "text-darkviolet bg-darkviolet/10",
        handle: "#58417E",
        checkbox: "text-darkviolet border-darkviolet/40 group-hover:border-darkviolet",
        loader: "text-darkviolet",
        progress: "from-darkviolet to-[#9d84c3]",
      };
    }
    if (t.includes("notion") || t.includes("db")) {
      return {
        container: "bg-pistachio/5 border-pistachio/40 hover:shadow-[0_15px_40px_rgba(97,128,99,0.2)]",
        dot: "bg-pistachio",
        badge: "text-pistachio bg-pistachio/10",
        handle: "#618063",
        checkbox: "text-pistachio border-pistachio/40 group-hover:border-pistachio",
        loader: "text-pistachio",
        progress: "from-pistachio to-[#9bc99e]",
      };
    }
    return {
      container: "bg-white/80 border-[#e6e2f3] hover:shadow-[var(--shadow-card)]",
      dot: "bg-[#dcd6ff]",
      badge: "text-secondary bg-secondary/10",
      handle: "#6c5ce7",
      checkbox: "text-[#6c5ce7] border-[#dcd6ff] group-hover:border-[#6c5ce7]",
      loader: "text-[#6c5ce7]",
      progress: "from-[#6c5ce7] to-[#9aa8ff]",
    };
  };

  const styles = getTypeStyles(type);

  return (
    <div
      className={`w-[220px] border rounded-2xl overflow-hidden backdrop-blur-sm transition-all ${styles.container}`}
    >
      {/* Target handle (left side) for incoming connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: styles.handle }}
      />

      {/* Source handle (right side) for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: styles.handle }}
      />

      <div className="p-3 border-b border-[#e6e2f3] flex items-center justify-between bg-white/60">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${styles.dot}`}
          ></span>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded ${styles.badge}`}>
            {type}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isSyncable && syncState === "success" && (
            <CheckCircle2 size={12} className="text-green-500" />
          )}
          {isSyncable && syncState === "loading" && (
            <Loader2 size={12} className={`${styles.loader} animate-spin`} />
          )}
          <MoreVertical size={12} className="text-secondary/50 cursor-pointer" />
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-white border border-[#e6e2f3] rounded-lg shadow-sm">
            {icon}
          </div>
          <h3 className="text-xs font-semibold text-primary truncate">
            {title}
          </h3>
        </div>

        {description && (
          <p className="text-[10px] text-secondary leading-tight italic">
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
                    className={`mt-0.5 h-3 w-3 rounded-sm border focus:ring-0 ${styles.checkbox}`}
                    checked={task.done}
                    onChange={() => onToggleFlowStep?.(task.id, !task.done, task.done)}
                    disabled={isDisabled}
                    aria-label={`${task.name} 완료`}
                  />
                  <span
                    className={`text-[10px] leading-tight flex-1 ${task.done ? "text-secondary/70 line-through" : "text-secondary"
                      }`}
                  >
                    {task.name}
                  </span>
                  {task.isUpdating && (
                    <Loader2 size={10} className={`${styles.loader} animate-spin mt-0.5`} />
                  )}
                </label>
              );
            })}
          </div>
        )}

        {isSyncable && (
          <div className="mt-3 pt-3 border-t border-dashed border-[#e6e2f3] flex items-center justify-between">
            <span className="text-[9px] font-bold text-secondary flex items-center gap-1">
              <Database size={10} />
              {syncState === "success" ? "Saved to Notion" : "Pending Sync"}
            </span>
            {syncState === "success" && (
              <ArrowRight size={10} className="text-secondary/50" />
            )}
          </div>
        )}

        {progress && progress.total > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-[#e6e2f3] space-y-1.5" data-testid="flow-progress">
            <div className="flex items-center justify-between text-[10px] font-bold text-secondary">
              <span>Progress</span>
              <span>{progress.done}/{progress.total}</span>
            </div>
            <div className="h-2 bg-[#e6e2f3] rounded-full overflow-hidden">
              <div
                className={`h-2 bg-gradient-to-r transition-all ${styles.progress}`}
                style={{ width: `${progress.percent}%` }}
                data-testid="flow-progress-bar"
              />
            </div>
            <div className="text-[9px] text-secondary text-right font-bold" data-testid="flow-progress-percent">
              {progress.percent}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
