"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { NotionCalendar } from "@/components/calendar/NotionCalendar";
import { FlowBoard } from "@/components/flow/FlowBoard";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f4f5f7] overflow-hidden selection:bg-blue-100">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className="w-1/2 h-full border-r border-[#ececeb] flex flex-col bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <NotionCalendar />
        </div>

        <div className="w-1/2 h-full flex flex-col bg-[#f9fafb]">
          <FlowBoard />
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
