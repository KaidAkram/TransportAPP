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
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { translations, SupportedLanguage } from "@/lib/i18n";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { company, userPreferences } = useSettingsStore();

  const currentLang = (userPreferences?.language as SupportedLanguage) || "fr";
  const t = translations[currentLang] || translations.fr;

  const NAV_ITEMS = [
    { name: t.navDashboard, href: "/", icon: LayoutDashboard },
    { name: t.navVehicles, href: "/vehicules", icon: Bus },
    { name: t.navEmployees, href: "/employes", icon: Users },
    { name: t.navCRM, href: "/partenaires", icon: Building2 },
    { name: t.navContracts, href: "/contrats", icon: FileText },
    { name: t.navCautions, href: "/cautions", icon: Shield },
  ];

  return (
    <aside
      className={cn(
        "fixed start-4 top-4 z-40 h-[calc(100vh-32px)] flex flex-col transition-all duration-400 ease-out glass-panel",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10 relative min-h-[85px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-glass)] border border-[var(--theme-border)] shadow-[0_0_10px_var(--theme-orb-primary)] overflow-hidden">
          {company?.logoBase64 ? (
            <img src={company.logoBase64} alt="Company Logo" className="w-full h-full object-cover mix-blend-screen" />
          ) : (
            <img src="/animated-logo.gif" alt="Software Logo" className="w-full h-full object-cover mix-blend-screen" />
          )}
        </div>
        
        {!collapsed && (
          <div className="flex flex-col justify-center overflow-hidden">
            <h1 className="font-brand text-[22px] font-normal text-white tracking-wide truncate">
              Fl&#333;
            </h1>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto font-sans scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                isActive
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0 transition-all duration-300", isActive ? "text-[var(--color-turbo)]" : "text-white/60")} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {isActive && !collapsed && (
                <div className="absolute end-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-s-full bg-[var(--color-turbo)] shadow-[0_0_10px_var(--color-turbo)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {user?.role === "admin" && (
          <>
            <div className="my-2 h-[1px] w-full bg-white/10" />
            <Link
              href="/admin/permissions"
              className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300", pathname === "/admin/permissions" ? "bg-white/10 text-white shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white")}
              title={collapsed ? t.navPermissions : undefined}
            >
              <CheckSquare className="h-4 w-4" />
              {!collapsed && <span className="text-sm font-medium tracking-wide">{t.navPermissions}</span>}
            </Link>
            <Link
              href="/admin/settings"
              className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300", pathname === "/admin/settings" ? "bg-[var(--color-electric-violet)]/20 text-white shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-[var(--color-electric-violet)]")}
              title={collapsed ? t.navEnterprise : undefined}
            >
              <Sliders className="h-4 w-4" />
              {!collapsed && <span className="text-sm font-medium tracking-wide">{t.navEnterprise}</span>}
            </Link>
          </>
        )}

        <Link
          href="/settings"
          className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300", pathname === "/settings" ? "bg-[var(--color-turbo)]/10 text-white shadow-sm border border-[var(--color-turbo)]/30" : "text-white/60 hover:bg-[var(--color-turbo)]/5 hover:text-[var(--color-turbo)]")}
          title={collapsed ? t.navSettings : undefined}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="text-sm font-medium tracking-wide">{t.navSettings}</span>}
        </Link>

        <button
          onClick={() => useAuthStore.getState().logout()}
          className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-400/80 transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
          title={collapsed ? t.navLogout : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-sm font-medium tracking-wide">{t.navLogout}</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full rounded-xl px-3 py-2 mt-2 text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-500", collapsed ? "rotate-180" : "")} />
          {!collapsed && (
            <span className="ms-2 text-xs font-accent tracking-widest uppercase">{t.navCollapse}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
