import React from "react";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Link2 } from "lucide-react";

const days1To15 = Array.from({ length: 15 }, (_, i) => i + 1);
const days16To31 = Array.from({ length: 16 }, (_, i) => i + 16);

export const NotionCalendar: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#37352f] flex items-center gap-3">
            📅 October 2023
          </h1>
          <p className="text-sm text-[#37352f]/60 mt-1">
            Split View: Life in Two Acts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm font-medium text-[#37352f]/60 hover:text-[#37352f] transition-colors">
            <Link2 size={16} />
            Notion Connected
          </button>
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
            {days1To15.map((day) => (
              <CalendarDay key={day} day={day} />
            ))}
          </div>
        </section>

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
            {days16To31.map((day) => (
              <CalendarDay key={day} day={day} isSecondPhase />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

interface CalendarDayProps {
  day: number;
  isSecondPhase?: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day }) => {
  const hasEvent = day % 3 === 0;

  return (
    <div
      className={`group min-h-[100px] border border-[#ececeb] rounded-lg p-2 transition-all hover:shadow-md cursor-pointer ${
        day === 12
          ? "bg-yellow-50/50 border-yellow-200"
          : "bg-[#fbfbfa] hover:bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-bold ${
            day === 12 ? "text-yellow-700" : "text-[#37352f]/40"
          }`}
        >
          {day}
        </span>
        <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#efefed] rounded transition-all">
          <Plus size={14} className="text-[#37352f]/40" />
        </button>
      </div>

      {hasEvent && (
        <div
          className={`text-[10px] px-1.5 py-0.5 rounded-sm mb-1 truncate ${
            day % 2 === 0
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {day % 2 === 0 ? "Project Alpha Sync" : "Submit Reports"}
        </div>
      )}

      {day === 12 && (
        <div className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-sm truncate">
          Birthday Party 🎉
        </div>
      )}
    </div>
  );
};
