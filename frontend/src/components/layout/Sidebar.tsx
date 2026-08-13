"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bus,
  Users,
  Building2,
  Wrench,
  Shield,
  FileText,
  Package,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Bus,
  Users,
  Building2,
  Wrench,
  Shield,
  FileText,
  Package,
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
      style={{ backgroundColor: "var(--color-sidebar)" }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
             style={{ backgroundColor: "var(--color-primary-base)" }}>
          <Bus className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-white truncate">E-Transport</h1>
            <p className="text-xs text-white/50">ERP Gestion</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-white" : "text-white/60"
                  )}
                />
              )}
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div
                  className="ml-auto h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-lg px-3 py-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && (
            <span className="ml-2 text-xs">Réduire</span>
          )}
        </button>
      </div>
    </aside>
  );
}
