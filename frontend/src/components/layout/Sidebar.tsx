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
  Receipt,
  BarChart3,
  LogOut,
  Sliders,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Bus,
  Users,
  Building2,
  Wrench,
  Shield,
  FileText,
  Package,
  Receipt,
  BarChart3,
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { company } = useSettingsStore();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 md:left-4 md:top-4 z-50 h-full md:h-[calc(100vh-32px)] flex flex-col transition-all duration-400 ease-out glass-panel !rounded-none md:!rounded-[24px]",
          collapsed ? "w-[72px]" : "w-[260px] md:w-[240px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10 relative min-h-[85px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-glass)] border border-[var(--theme-border)] shadow-[0_0_10px_var(--theme-orb-primary)] overflow-hidden">
          {company.logoBase64 ? (
            <img src={company.logoBase64} alt="Company Logo" className="w-full h-full object-cover mix-blend-screen" />
          ) : (
            <img src="/animated-logo.gif" alt="Software Logo" className="w-full h-full object-cover mix-blend-screen" />
          )}
        </div>
        
        {!collapsed && (
          <div className="flex flex-col justify-center overflow-hidden">
            <h1 
              className="font-brand text-[22px] font-normal text-white tracking-wide truncate"
              style={{ textShadow: '0 0 10px rgba(255,255,255,0.05)' }}
            >
              Fl&#333;
            </h1>
            <p className="font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-white/50 whitespace-nowrap mt-0.5">
              Fleet Management & BI
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto font-sans scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                isActive
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-300",
                    isActive ? "text-[var(--color-turbo)]" : "text-white/60 group-hover:text-white group-hover:translate-x-1"
                  )}
                />
              )}
              {!collapsed && <span className="truncate">{item.label}</span>}
              
              {/* Active Indicator Glow */}
              {isActive && !collapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-l-full bg-[var(--color-turbo)] shadow-[0_0_10px_var(--color-turbo)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle & Footer Actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {user?.role === "admin" && (
          <>
            <Link
              href="/admin/features"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                pathname === "/admin/features"
                  ? "bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? "Permissions (Admin)" : undefined}
            >
              <ShieldCheck
                className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-300",
                  pathname === "/admin/features" ? "text-[var(--color-electric-violet)]" : "text-white/60 group-hover:text-white group-hover:translate-x-1"
                )}
              />
              {!collapsed && <span className="truncate">Permissions</span>}
            </Link>
            <Link
              href="/admin/settings"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                pathname === "/admin/settings"
                  ? "bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? "SaaS (Admin)" : undefined}
            >
              <Sliders
                className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-300",
                  pathname === "/admin/settings" ? "text-[var(--color-electric-violet)]" : "text-white/60 group-hover:text-white group-hover:translate-x-1"
                )}
              />
              {!collapsed && <span className="truncate">Entreprise (SaaS)</span>}
            </Link>
          </>
        )}

        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden group",
            pathname === "/settings"
              ? "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border border-[var(--color-turbo)]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
          title={collapsed ? "Paramètres" : undefined}
        >
          <Settings
            className={cn(
              "h-5 w-5 shrink-0 transition-all duration-300",
              pathname === "/settings" ? "text-[var(--color-turbo)]" : "text-white/60 group-hover:text-white group-hover:translate-x-1"
            )}
          />
          {!collapsed && <span className="truncate">Mes Préférences</span>}
        </Link>

        <button
          onClick={() => { logout(); if (onCloseMobileMenu) onCloseMobileMenu(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 group"
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" />
          {!collapsed && <span className="truncate">Déconnexion</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-full rounded-xl px-3 py-2 mt-2 text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-500",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && (
            <span className="ml-2 text-xs font-accent tracking-widest uppercase">Réduire</span>
          )}
        </button>

        {/* Collapse Toggle Desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full bg-[var(--theme-orb-primary)] border border-white/20 text-white shadow-[0_0_10px_rgba(131,77,251,0.5)] hover:scale-110 transition-transform"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")}
          />
        </button>
      </div>
    </aside>
    </>
  );
}
