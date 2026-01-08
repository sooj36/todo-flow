import React from "react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active = false,
  collapsed = false,
}) => (
  <button
    className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-3 py-2 text-sm rounded-lg transition-all font-medium ${
      active
        ? "bg-[#efefed] text-[#37352f]"
        : "text-[#37352f]/60 hover:bg-[#efefed]/50 hover:text-[#37352f]"
    }`}
  >
    <span className={active ? "text-black" : "text-[#37352f]/40"}>
      {icon}
    </span>
    {!collapsed && label}
    {collapsed && <span className="sr-only">{label}</span>}
  </button>
);
