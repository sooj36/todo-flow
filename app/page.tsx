"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { NotionCalendar } from "@/components/calendar/NotionCalendar";
import { FlowBoard } from "@/components/flow/FlowBoard";
import { Sidebar } from "@/components/layout/Sidebar";
import { SearchBar } from "@/components/agent/SearchBar";
import { ProgressIndicator } from "@/components/agent/ProgressIndicator";
import { QualificationPanel } from "@/components/agent/QualificationPanel";
import { useAgentQuery } from "@/lib/hooks/useAgentQuery";
import { TaskStatus } from "@/types";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Shared date state
  const [flowBoardRefreshTrigger, setFlowBoardRefreshTrigger] = useState(0);
  const [instanceStatusOverrides, setInstanceStatusOverrides] = useState<Record<string, TaskStatus>>({});
  const [templateProgress, setTemplateProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [dayStepProgressOverrides, setDayStepProgressOverrides] = useState<Record<string, { completed: number; total: number }>>({});
  const mainRef = useRef<HTMLElement>(null);

  // Agent query state
  const { phase, data, error, executeQuery, retry } = useAgentQuery();

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const nextRatio = (event.clientX - rect.left) / rect.width;
      const clamped = Math.min(0.7, Math.max(0.3, nextRatio));
      setSplitRatio(clamped);
    };

    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const stored = window.localStorage.getItem("layout:splitRatio");
    if (!stored) return;
    const parsed = Number.parseFloat(stored);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(0.7, Math.max(0.3, parsed));
    setSplitRatio(clamped);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("layout:splitRatio", String(splitRatio));
  }, [splitRatio]);

  const handleInstanceStatusChange = useCallback(
    (updates: Array<{ instanceId: string; status: TaskStatus }>) => {
      setInstanceStatusOverrides((prev) => {
        const next = { ...prev };
        updates.forEach(({ instanceId, status }) => {
          next[instanceId] = status;
        });
        return next;
      });
    },
    []
  );

  const handleTemplateProgressChange = useCallback(
    (progress: Record<string, { done: number; total: number }>) => {
      setTemplateProgress(progress);
    },
    []
  );

  const handleDayStepProgressChange = useCallback(
    (date: string, progress: { completed: number; total: number }) => {
      setDayStepProgressOverrides((prev) => ({
        ...prev,
        [date]: progress,
      }));
    },
    []
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-primary selection:bg-[#d6d1ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-[#dcd6ff] blur-3xl opacity-60" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[#c7f0ff] blur-3xl opacity-50" />
      </div>

      <div className="relative flex h-screen w-full max-w-[1600px] mx-auto px-6 py-5 gap-5">
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main
          ref={mainRef}
          className={`relative flex-1 flex overflow-hidden rounded-[30px] border border-[#e6e2f3] bg-white/70 backdrop-blur shadow-[var(--shadow-soft)] ${isDragging ? "select-none" : ""}`}
        >
          <div
            data-testid="calendar-panel"
            className="h-full border-r border-[#e6e2f3] flex flex-col bg-white/90 backdrop-blur-sm z-10 shadow-[var(--shadow-card)]/70 min-w-[320px] flex-none px-5"
            style={{ width: `${splitRatio * 100}%` }}
          >
            <NotionCalendar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onTaskCreated={() => setFlowBoardRefreshTrigger((prev) => prev + 1)}
              instanceStatusOverrides={instanceStatusOverrides}
              templateProgress={templateProgress}
              dayStepProgressOverrides={dayStepProgressOverrides}
            />
          </div>

          <div
            data-testid="flow-panel"
            className="h-full flex flex-col bg-[#f8f6ff] min-w-[320px] flex-none overflow-hidden"
            style={{ width: `${(1 - splitRatio) * 100}%` }}
          >
            {/* Agent Section */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur p-5 space-y-4 border-b border-transparent shadow-[var(--shadow-card)]">
            <SearchBar onSearch={executeQuery} />
              <ProgressIndicator phase={phase} error={error ?? undefined} onRetry={retry} />
              {phase === "done" && data && <QualificationPanel data={data} />}
            </div>

            {/* FlowBoard Section */}
            <div className="flex-1 overflow-auto">
              <FlowBoard
                selectedDate={selectedDate}
                refreshTrigger={flowBoardRefreshTrigger}
                instanceStatusOverrides={instanceStatusOverrides}
                onInstanceStatusChange={handleInstanceStatusChange}
                onTemplateProgressChange={handleTemplateProgressChange}
                onDayStepProgressChange={handleDayStepProgressChange}
              />
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuemin={30}
            aria-valuemax={70}
            aria-valuenow={Math.round(splitRatio * 100)}
            title="Drag to resize"
            onPointerDown={() => setIsDragging(true)}
            className={`absolute top-4 bottom-4 w-4 cursor-col-resize z-20 group ${isDragging ? "cursor-col-resize" : ""}`}
            style={{ left: `calc(${splitRatio * 100}% - 6px)` }}
          >
            <div className="h-full w-px bg-[#d7d2ef] mx-auto transition-all group-hover:bg-[#b7addf] group-hover:w-0.5" />
            <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 rounded-full bg-[#b7addf]/0 group-hover:bg-[#b7addf]/30 transition-colors" />
          </div>

          {/*
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            <button className="w-12 h-12 bg-white/90 border border-[#dcd6ff] text-primary rounded-full flex items-center justify-center shadow-[var(--shadow-card)] hover:shadow-[0_15px_35px_rgba(108,92,231,0.35)] hover:-translate-y-1 transition-all active:scale-95 group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform text-[#6c5ce7]" />
            </button>
          </div>
          */}
        </main>
      </div>
    </div>
  );
}
