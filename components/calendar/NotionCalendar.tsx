"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Link2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useTaskInstances } from "@/hooks/useTaskInstances";
import { CalendarDayData } from "@/types";

const days1To15 = Array.from({ length: 15 }, (_, i) => i + 1);
const days16To31 = Array.from({ length: 16 }, (_, i) => i + 16);

export const NotionCalendar: React.FC = () => {
  const now = new Date(); // Actual current date for "today" highlighting
  const [selectedDate, setSelectedDate] = useState(new Date()); // Viewed/focused date

  const today = now.getDate();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(selectedDate); // Use selectedDate for display

  const { instances, loading, error, refetch } = useTaskInstances();

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
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const calendarData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dataMap = new Map<string, CalendarDayData>();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayInstances = instances.filter(inst => inst.date === date);
      dataMap.set(date, {
        date,
        totalTasks: dayInstances.length,
        completedTasks: dayInstances.filter(inst => inst.status === 'done').length,
        tasks: dayInstances,
      });
    }

    return dataMap;
  }, [instances, selectedDate]); // Changed: now -> selectedDate

  const isConnected = !loading && !error;

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#37352f] flex items-center gap-3">
            📅 {monthLabel}
          </h1>
          <p className="text-sm text-[#37352f]/60 mt-1">
            Split View: Life in Two Acts
          </p>
        </div>
        <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2 text-sm font-medium text-[#37352f]/60">
              <Loader2 size={16} className="animate-spin" />
              Loading...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-500">
              <AlertCircle size={16} />
              <span>Connection error — Check .env.local</span>
            </div>
          )}
          {!loading && !error && (
            <div
              className={`flex items-center gap-2 text-xs font-semibold tracking-wide ${isConnected
                ? "rounded-full bg-green-100 px-3 py-1 text-green-700"
                : "text-[#37352f]/60"
                }`}
            >
              <Link2 size={16} />
              {isConnected ? "notion connect success" : "Notion not connected"}
            </div>
          )}
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
          <div className="flex items-center bg-[#efefed] rounded-md p-1">
            <button
              onClick={handlePreviousDay}
              className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 text-xs font-bold uppercase tracking-tight hover:bg-white rounded transition-all"
            >
              {selectedDate.toDateString() === now.toDateString()
                ? 'Today'
                : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#ececeb] pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#37352f]/40">
              Phase 01: 01 — 15
            </h2>
            <button className="text-[#37352f]/40 hover:text-[#37352f] transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {days1To15.map((day) => {
              const year = now.getFullYear();
              const month = now.getMonth();
              const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = calendarData.get(date);
              return (
                <CalendarDay
                  key={day}
                  day={day}
                  data={dayData}
                  loading={loading}
                  isToday={day === today}
                />
              );
            })}
          </div>
        </section>

        <div className="flex items-center justify-center">
          <div className="h-1 w-full rounded-full bg-red-500/80"></div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4 border-b border-[#ececeb] pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#37352f]/40">
              Phase 02: 16 — 31
            </h2>
            <button className="text-[#37352f]/40 hover:text-[#37352f] transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {days16To31.map((day) => {
              const year = now.getFullYear();
              const month = now.getMonth();
              const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = calendarData.get(date);
              return (
                <CalendarDay
                  key={day}
                  day={day}
                  data={dayData}
                  isSecondPhase
                  loading={loading}
                  isToday={day === today}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

interface CalendarDayProps {
  day: number;
  isSecondPhase?: boolean;
  data?: CalendarDayData;
  loading?: boolean;
  isToday?: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, data, loading, isToday }) => {
  const completionRate = data && data.totalTasks > 0
    ? data.completedTasks / data.totalTasks
    : 0;

  const bgColor = completionRate >= 0.8
    ? "bg-green-50 border-green-200"
    : completionRate >= 0.5
      ? "bg-yellow-50 border-yellow-200"
      : completionRate > 0
        ? "bg-blue-50 border-blue-200"
        : "bg-[#fbfbfa]";

  const todayBorder = isToday ? "border-2 border-black" : "border border-[#ececeb]";
  const todayBg = isToday ? "bg-green-200/80" : bgColor;

  if (loading) {
    return (
      <div
        data-testid={`calendar-day-${day}`}
        className={`group min-h-[100px] rounded-lg p-2 bg-[#fbfbfa] animate-pulse ${todayBorder}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#37352f]/40">{day}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div
      data-testid={`calendar-day-${day}`}
      className={`group min-h-[100px] rounded-lg p-2 transition-all hover:shadow-md cursor-pointer ${todayBg} ${todayBorder} hover:bg-white`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#37352f]/40">{day}</span>
        <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#efefed] rounded transition-all">
          <Plus size={14} className="text-[#37352f]/40" />
        </button>
      </div>

      {data && data.totalTasks > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#37352f]/60">
            <span>{data.completedTasks}/{data.totalTasks} tasks</span>
            <span>{Math.round(completionRate * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${completionRate >= 0.8
                ? "bg-green-500"
                : completionRate >= 0.5
                  ? "bg-yellow-500"
                  : "bg-blue-500"
                }`}
              style={{ width: `${completionRate * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};
