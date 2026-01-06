import React from "react";
import {
  Layout,
  Calendar,
  Workflow,
  Settings,
  Bell,
  Search,
  Database,
} from "lucide-react";
import { NavItem } from "@/components/layout/NavItem";

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#fbfbfa] border-r border-[#ececeb] flex flex-col shrink-0 z-30">
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
          B
        </div>
        <span className="font-bold text-[#37352f] tracking-tight">
          Flow Planner
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <NavItem icon={<Search size={16} />} label="Search" />
        <NavItem icon={<Settings size={16} />} label="Settings" />

        <div className="pt-6 pb-2 px-3">
          <span className="text-[10px] font-bold text-[#37352f]/30 uppercase tracking-[0.2em]">
            Dashboard
          </span>
        </div>
        <NavItem icon={<Layout size={16} />} label="Daily Flow" active />
        <NavItem icon={<Calendar size={16} />} label="Bi-Weekly Grid" />
        <NavItem icon={<Database size={16} />} label="Notion Database" />
        <NavItem icon={<Workflow size={16} />} label="Integrations" />
      </nav>

      <div className="p-4 border-t border-[#ececeb]">
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#efefed] rounded-lg cursor-pointer transition-all">
          <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
            JD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-[#37352f] truncate">
              Jane&apos;s Workspace
            </span>
            <span className="text-[9px] text-[#37352f]/50 font-medium">
              Synced with Notion
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
