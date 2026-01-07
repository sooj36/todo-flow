"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Link2, Loader2, AlertCircle } from "lucide-react";
import { useTaskInstances } from "@/hooks/useTaskInstances";
import { CalendarDayData } from "@/types";

const days1To15 = Array.from({ length: 15 }, (_, i) => i + 1);
const days16To31 = Array.from({ length: 16 }, (_, i) => i + 16);

interface NotionCalendarProps {
  onConnectClick?: () => void;
}

export const NotionCalendar: React.FC<NotionCalendarProps> = ({ onConnectClick }) => {
  const now = new Date();
  const today = now.getDate();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(now);

  const { instances, loading, error } = useTaskInstances();

  const calendarData = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
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
  }, [instances, now]);

  const isConnected = !error && instances.length === 0 && !loading;

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
          {loading && (
            <div className="flex items-center gap-2 text-sm font-medium text-[#37352f]/60">
              <Loader2 size={16} className="animate-spin" />
              Loading...
            </div>
          )}
          {error && (
            <button
              onClick={onConnectClick}
              className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              <AlertCircle size={16} />
              Connection error
            </button>
          )}
          {!loading && !error && (
            <button
              onClick={onConnectClick}
              className="flex items-center gap-2 text-sm font-medium text-[#37352f]/60 hover:text-[#37352f] transition-colors"
            >
              <Link2 size={16} />
              {isConnected ? 'Connected to Notion' : 'Notion not connected'}
            </button>
          )}
          <div className="flex items-center bg-[#efefed] rounded-md p-1">
            <button className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 text-xs font-bold uppercase tracking-tight">
              Today
            </button>
            <button className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
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
              className={`h-full transition-all ${
                completionRate >= 0.8
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
