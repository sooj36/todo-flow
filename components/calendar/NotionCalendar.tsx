"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Link2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useTaskInstances } from "@/hooks/useTaskInstances";
import { useCreateTask } from "@/hooks/useCreateTask";
import { CalendarDayData, TaskStatus } from "@/types";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { applyInstanceStatusOverrides, aggregateDayStepProgress } from "@/utils/taskInstances";

const days1To15 = Array.from({ length: 15 }, (_, i) => i + 1);
const days16To31 = Array.from({ length: 16 }, (_, i) => i + 16);

interface NotionCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskCreated?: () => void;
  instanceStatusOverrides?: Record<string, TaskStatus>;
  templateProgress?: Record<string, { done: number; total: number }>;
  dayStepProgressOverrides?: Record<string, { completed: number; total: number }>;
}

export const NotionCalendar: React.FC<NotionCalendarProps> = ({
  selectedDate,
  onDateChange,
  onTaskCreated,
  instanceStatusOverrides,
  templateProgress = {},
  dayStepProgressOverrides = {},
}) => {
  const now = new Date(); // Actual current date for "today" highlighting

  const today = now.getDate();
  const monthLabel = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).formatToParts(selectedDate);
    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    return `${year} ${month}`.trim();
  }, [selectedDate]); // Use selectedDate for display

  const { instances, loading, error, refetch } = useTaskInstances();
  const { createTask } = useCreateTask();

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDialogDate, setCreateDialogDate] = useState<Date>(new Date());

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

    const result = await refetch();

    setIsSyncing(false);

    if (!result.success) {
      const errorMsg = result.error || "Sync failed";
      setSyncError(true);
      setSyncErrorMessage(errorMsg);
      syncTimeoutRef.current = setTimeout(() => {
        setSyncError(false);
        setSyncErrorMessage("");
      }, 5000);
    } else {
      setSyncSuccess(true);
      syncTimeoutRef.current = setTimeout(() => setSyncSuccess(false), 5000);
    }
  }, [refetch]);

  const handlePreviousDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  }, [selectedDate, onDateChange]);

  const handleNextDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  }, [selectedDate, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  const handleDayClick = useCallback((day: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    onDateChange(newDate);
  }, [selectedDate, onDateChange]);

  const handleOpenCreateDialog = useCallback((day: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setCreateDialogDate(newDate);
    setIsCreateDialogOpen(true);
  }, [selectedDate]);


  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    // Refetch instances after successful creation
    await refetch();
    // Notify parent to trigger FlowBoard templates refetch
    onTaskCreated?.();
  }, [refetch, onTaskCreated]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const effectiveInstances = useMemo(
    () => applyInstanceStatusOverrides(instances, instanceStatusOverrides),
    [instances, instanceStatusOverrides]
  );

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarData = new Map<string, CalendarDayData>();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayInstances = effectiveInstances.filter(inst => inst.date === date);
    const moodInstance = dayInstances
      .filter((inst) => inst.mood)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const overrideProgress = dayStepProgressOverrides[date];
    const stepTotals = overrideProgress
      ? overrideProgress
      : aggregateDayStepProgress(dayInstances, {});
    calendarData.set(date, {
      date,
      totalTasks: stepTotals.total,
      completedTasks: stepTotals.completed,
      tasks: dayInstances,
      mood: moodInstance?.mood,
    });
  }

  const isConnected = !loading && !error;

  return (
    <div className="flex flex-col h-full">
      <div
        data-testid="calendar-header"
        className="calendar-header px-6 py-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold text-primary flex items-center gap-3">
            🗓️ {monthLabel}
          </h1>
          <p className="text-sm text-secondary mt-1 calendar-subtext">
            .......
          </p>
        </div>
        <div className="calendar-toolbar flex flex-wrap items-center justify-end gap-4 min-w-0">
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

          {loading && (
            <div className="flex items-center gap-2 text-sm font-medium text-secondary flex-shrink-0">
              <Loader2 size={16} className="animate-spin text-[#6c5ce7]" />
              Loading...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm font-semibold text-red-500 bg-[#ffecec] px-3 py-2 rounded-full shadow-sm flex-shrink-0">
              <AlertCircle size={16} />
              <span>Connection error — 노션 연결 확인</span>
            </div>
          )}
          {!loading && !error && (
            <div
              className={`flex items-center gap-2 text-xs font-semibold tracking-wide ${isConnected
                ? "rounded-full bg-[#e7f8f1] px-3 py-1.5 text-[#0d8f5b] shadow-sm"
                : "text-secondary"
                } flex-shrink-0`}
            >
              <Link2 size={16} />
              <span className="calendar-connection-text">
                {isConnected ? "Notion connected" : "Notion not connected"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
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
          <div className="flex items-center bg-[#f6f4ff] border border-[#e6e2f3] rounded-full p-1 shadow-sm">
            <button
              onClick={handlePreviousDay}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-4 text-xs font-bold uppercase tracking-tight hover:bg-white rounded-full transition-all text-primary"
              aria-label="Go to today"
            >
              {selectedDate.toDateString() === now.toDateString()
                ? 'Today'
                : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#e6e2f3] pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary/60">
              Phase 01: 01 — 15
            </h2>
            <button className="text-secondary/60 hover:text-primary transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {days1To15.map((day) => {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = calendarData.get(date);
              const cellDate = new Date(year, month, day);
              const isToday = cellDate.toDateString() === now.toDateString();
              const isSelected = cellDate.toDateString() === selectedDate.toDateString();
              return (
                <CalendarDay
                  key={day}
                  day={day}
                  data={dayData}
                  loading={loading}
                  isToday={isToday}
                  isSelected={isSelected}
                  onClick={handleDayClick}
                  onAddClick={handleOpenCreateDialog}
                />
              );
            })}
          </div>
        </section>

        <div className="flex items-center justify-center">
          <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#dcd6ff] via-[#c7f0ff] to-[#dcd6ff] shadow-inner"></div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#e6e2f3] pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary/60">
              Phase 02: 16 — 31
            </h2>
            <button className="text-secondary/60 hover:text-primary transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {days16To31.map((day) => {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = calendarData.get(date);
              const cellDate = new Date(year, month, day);
              const isToday = cellDate.toDateString() === now.toDateString();
              const isSelected = cellDate.toDateString() === selectedDate.toDateString();
              return (
                <CalendarDay
                  key={day}
                  day={day}
                  data={dayData}
                  isSecondPhase
                  loading={loading}
                  isToday={isToday}
                  isSelected={isSelected}
                  onClick={handleDayClick}
                  onAddClick={handleOpenCreateDialog}
                />
              );
            })}
          </div>
        </section>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        selectedDate={createDialogDate}
        onClose={handleCloseCreateDialog}
        onSubmit={createTask}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

interface CalendarDayProps {
  day: number;
  isSecondPhase?: boolean;
  data?: CalendarDayData;
  loading?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  onClick?: (day: number) => void;
  onAddClick?: (day: number) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  data,
  loading,
  isToday,
  isSelected,
  onClick,
  onAddClick,
}) => {
  const completionRate = data && data.totalTasks > 0
    ? data.completedTasks / data.totalTasks
    : 0;

  const bgColor = completionRate >= 0.8
    ? "bg-[#e9f7ef] border-[#bfead2]"
    : completionRate >= 0.5
      ? "bg-[#fff2df] border-[#ffd4a3]"
      : completionRate > 0
        ? "bg-[#fff8dc] border-[#f3e3a1]"
        : "bg-white/80";

  // Priority: isSelected > isToday
  const borderClass = isSelected
    ? "border-2 border-[#c7c7c7] shadow-[0_12px_30px_rgba(55,53,47,0.12)]"  // Selected: neutral
    : (isToday ? "border-2 border-[#0d8f5b]" : "border border-[#e6e2f3]");  // Today: subtle

  const selectedBg = isSelected ? "bg-white" : bgColor;

  if (loading) {
    return (
      <div
        data-testid={`calendar-day-${day}`}
        className={`group min-h-[100px] rounded-2xl p-3 bg-white/70 animate-pulse ${borderClass}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-secondary/70">{day}</span>
        </div>
        <div className="h-2 bg-[#e6e2f3] rounded w-full"></div>
      </div>
    );
  }

  return (
    <div
      data-testid={`calendar-day-${day}`}
      onClick={() => onClick?.(day)}
      className={`group relative min-h-[100px] rounded-2xl p-3 transition-all hover:shadow-lg cursor-pointer ${selectedBg} ${borderClass} hover:bg-white`}
    >
      {/* Today dot: only show if today but NOT selected */}
      {isToday && !isSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#0d8f5b] rounded-full" />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-secondary/70">{day}</span>
          {data?.mood && (
            <span className="text-xs" aria-label={`Mood ${data.mood}`}>
              {data.mood}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddClick?.(day);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-full transition-all shadow-sm"
          aria-label={`Add task for day ${day}`}
        >
          <Plus size={14} className="text-secondary/60" />
        </button>
      </div>

      {data && data.totalTasks > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-secondary">
            <span>{data.completedTasks}/{data.totalTasks} steps</span>
            <span>{Math.round(completionRate * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#e6e2f3] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${completionRate >= 0.8
                ? "bg-gradient-to-r from-[#159a67] to-[#2ed08a]"
                : completionRate >= 0.5
                  ? "bg-gradient-to-r from-[#f6b85c] to-[#ff9c2a]"
                  : "bg-gradient-to-r from-[#f4d27a] to-[#f0b64b]"
                }`}
              style={{ width: `${completionRate * 100}%` }}
            ></div>
          </div>
        </div>
      )}

    </div>
  );
};
