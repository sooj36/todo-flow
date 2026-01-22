import React from "react";
import {
  Layout,
  Calendar,
  Workflow,
  Settings,
  Bell,
  Search,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavItem } from "@/components/layout/NavItem";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggle,
}) => {
  return (
    <aside
      className={`bg-white/80 backdrop-blur flex flex-col shrink-0 z-30 transition-[width] duration-200 border border-[#e6e2f3] shadow-[var(--shadow-card)] rounded-[24px] ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="relative p-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          {/*
          <div className="w-10 h-10 bg-gradient-to-br from-[#6c5ce7] to-[#9aa8ff] rounded-xl flex items-center justify-center text-white font-black shadow-lg">
            F
          </div>
          */}
          {!collapsed && (
            <span className="font-bold text-lg text-primary tracking-tight">
              Flow Planner
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`absolute top-4 ${collapsed ? "right-2" : "right-4"} p-1.5 rounded-full text-secondary/60 hover:text-primary hover:bg-[#f0edff] transition-all`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <NavItem icon={<Search size={16} />} label="Search" collapsed={collapsed} />
        <NavItem icon={<Settings size={16} />} label="Settings" collapsed={collapsed} />

        {!collapsed && (
          <div className="pt-6 pb-2 px-3">
            <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-[0.28em]">
              Dashboard
            </span>
          </div>
        )}
        <NavItem icon={<Layout size={16} />} label="Daily Flow" active collapsed={collapsed} />
        <NavItem icon={<Calendar size={16} />} label="Bi-Weekly Grid" collapsed={collapsed} />
        <NavItem icon={<Database size={16} />} label="Notion Database" collapsed={collapsed} />
        <NavItem icon={<Workflow size={16} />} label="Integrations" collapsed={collapsed} />
      </nav>

      <div className="p-4 border-t border-[#e6e2f3]">
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2 hover:bg-[#f0edff] rounded-xl cursor-pointer transition-all`}
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-[#6c5ce7] to-[#88ddff] rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
            JD
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-primary truncate">
                Soo&apos;s Workspace
              </span>
              <span className="text-[10px] text-secondary/70 font-medium">
                Synced with Notion
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
