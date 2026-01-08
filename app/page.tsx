"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { NotionCalendar } from "@/components/calendar/NotionCalendar";
import { FlowBoard } from "@/components/flow/FlowBoard";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

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

  return (
    <div className="flex h-screen w-full bg-[#f4f5f7] overflow-hidden selection:bg-blue-100">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <main
        ref={mainRef}
        className={`relative flex-1 flex overflow-hidden ${isDragging ? "select-none" : ""}`}
      >
        <div
          className="h-full border-r border-[#ececeb] flex flex-col bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] min-w-0 flex-none"
          style={{ width: `${splitRatio * 100}%` }}
        >
          <NotionCalendar />
        </div>

        <div
          className="h-full flex flex-col bg-[#f9fafb] min-w-0 flex-none"
          style={{ width: `${(1 - splitRatio) * 100}%` }}
        >
          <FlowBoard />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={30}
          aria-valuemax={70}
          aria-valuenow={Math.round(splitRatio * 100)}
          title="Drag to resize"
          onPointerDown={() => setIsDragging(true)}
          className={`absolute top-0 bottom-0 w-3 cursor-col-resize z-20 group ${
            isDragging ? "cursor-col-resize" : ""
          }`}
          style={{ left: `calc(${splitRatio * 100}% - 6px)` }}
        >
          <div className="h-full w-px bg-[#ececeb] mx-auto transition-colors group-hover:bg-[#cfd2d7] group-hover:w-0.5" />
          <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 rounded-full bg-[#cfd2d7]/0 group-hover:bg-[#cfd2d7]/30 transition-colors" />
        </div>
      </main>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <button className="w-12 h-12 bg-white border border-[#ececeb] text-[#37352f] rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 group">
          <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
}
