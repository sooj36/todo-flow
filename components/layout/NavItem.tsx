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
    className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-3 py-2.5 text-sm rounded-full transition-all font-medium ${
      active
        ? "bg-[#f0edff] text-primary shadow-[0_10px_30px_rgba(108,92,231,0.15)]"
        : "text-secondary hover:bg-[#f6f4ff] hover:text-primary"
    }`}
  >
    <span className={active ? "text-[#6c5ce7]" : "text-secondary/60"}>
      {icon}
    </span>
    {!collapsed && label}
    {collapsed && <span className="sr-only">{label}</span>}
  </button>
);
