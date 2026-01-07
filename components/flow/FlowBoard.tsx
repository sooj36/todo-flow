"use client";

import React from "react";
import {
  Play,
  Plus,
  Zap,
  Cpu,
  ListTodo,
  MoreVertical,
  Coffee,
  Briefcase,
  Database,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTaskInstances } from "@/hooks/useTaskInstances";
import { useTaskTemplates } from "@/hooks/useTaskTemplates";

// Helper function to get local date in YYYY-MM-DD format
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const FlowBoard: React.FC = () => {
  const today = getLocalDateString();
  const { instances, loading: instancesLoading, error: instancesError } = useTaskInstances(today);
  const { templates, loading: templatesLoading, error: templatesError } = useTaskTemplates();

  const loading = instancesLoading || templatesLoading;
  const error = instancesError || templatesError;
  const isConnected = !loading && !error;

  return (
    <div className="relative flex flex-col h-full dot-grid overflow-hidden">
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
                  className={`flex items-center gap-1 text-[10px] font-bold tracking-wide ${
                    isConnected
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
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold ${
              isConnected
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <Play size={14} fill="currentColor" />
            {isConnected ? "notion connect success" : "Configure .env.local"}
          </div>
          <button className="p-2 bg-white border border-[#ececeb] rounded-md text-[#37352f]/60 hover:text-[#37352f] transition-all">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-auto custom-scrollbar p-12">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ minWidth: "1000px", minHeight: "1000px" }}
        >
          <path
            d="M 180 150 L 320 150"
            stroke="#e5e7eb"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 480 150 C 550 150, 550 80, 620 80"
            stroke="#e5e7eb"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 480 150 C 550 150, 550 220, 620 220"
            stroke="#e5e7eb"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 480 150 L 620 150"
            stroke="#e5e7eb"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        <div className="relative space-y-12">
          <div className="flex items-center gap-20">
            <FlowNode
              title="Daily Start"
              icon={<Zap className="text-orange-500" size={16} />}
              status="idle"
              type="Trigger"
            />

            <FlowNode
              title="AI Daily Reporter"
              icon={<Cpu className="text-purple-500" size={16} />}
              status="idle"
              type="AI Agent"
            />
          </div>

          <div className="flex flex-col gap-8 ml-[620px]">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-gray-400" size={32} />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-8 text-red-500">
                <AlertCircle size={20} className="mr-2" />
                <span className="text-sm">Failed to load tasks</span>
              </div>
            ) : instances.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-gray-400">
                <span className="text-sm">No tasks for today</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-gray-400">
                <span className="text-sm">No templates available</span>
              </div>
            ) : (
              (() => {
                const nodes = templates.map((template) => {
                  const templateInstances = instances.filter(inst => inst.templateId === template.id);
                  if (templateInstances.length === 0) return null;

                  const completedCount = templateInstances.filter(inst => inst.status === 'done').length;
                  const syncState = completedCount === templateInstances.length ? 'success' : 'idle';
                  const status = templateInstances.some(inst => inst.status === 'doing') ? 'running' : 'idle';

                  return (
                    <FlowNode
                      key={template.id}
                      id={template.id}
                      title={template.name}
                      icon={<Briefcase className="text-blue-500" size={16} />}
                      status={status}
                      type="Notion DB"
                      isSyncable
                      syncState={syncState}
                      tasks={templateInstances.map(inst => `${inst.template.name} - ${inst.date}`)}
                    />
                  );
                }).filter(Boolean);

                return nodes.length > 0 ? nodes : (
                  <div className="flex items-center justify-center p-8 text-gray-400">
                    <span className="text-sm">No matching tasks for today</span>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#ececeb] bg-white flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
            <Database size={12} />
            DATABASE ID: —
          </div>
          <div className="text-[11px] text-gray-400">
            Auto-save disabled until connected
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div className="w-2 h-2 rounded-full bg-orange-500 opacity-30"></div>
          <div className="w-2 h-2 rounded-full bg-red-500 opacity-30"></div>
        </div>
      </div>
    </div>
  );
};

interface FlowNodeProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  status: "idle" | "running" | "success" | "error";
  type: string;
  description?: string;
  tasks?: string[];
  isSyncable?: boolean;
  syncState?: "idle" | "loading" | "success";
}

const FlowNode: React.FC<FlowNodeProps> = ({
  title,
  icon,
  status,
  type,
  description,
  tasks,
  isSyncable,
  syncState,
}) => {
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
      className={`w-[220px] border rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:shadow-md ${
        statusColors[status]
      }`}
    >
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

        {tasks && (
          <div className="space-y-1.5 mt-2">
            {tasks.map((task) => (
              <div key={task} className="flex items-start gap-2 group cursor-pointer">
                <div className="w-3 h-3 mt-0.5 border border-gray-300 rounded-sm group-hover:border-blue-400 transition-colors bg-white"></div>
                <span className="text-[10px] text-gray-500 leading-tight">
                  {task}
                </span>
              </div>
            ))}
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
      </div>

      <div className="relative">
        <div className="absolute left-[-6px] top-[-50px] w-3 h-3 bg-white border border-gray-300 rounded-full z-10 shadow-sm"></div>
        {type !== "Trigger" && type !== "AI Agent" && (
          <div className="absolute right-[-6px] top-[-50px] w-3 h-3 bg-white border border-gray-300 rounded-full z-10 shadow-sm flex items-center justify-center">
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};
