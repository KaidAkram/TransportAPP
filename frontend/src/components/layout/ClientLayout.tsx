"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore, TYPOGRAPHY_VIBES } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";
import { PermissionDeniedModal } from "@/components/shared/PermissionDeniedModal";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, initAuth, user } = useAuthStore();
  const { adminTheme, adminTypographyVibe, userPreferences } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    initAuth();
    // Fetch global system settings (enforced for everyone)
    useSettingsStore.getState().fetchGlobalSettings();
  }, [initAuth]);

  // Apply theme to <body>
  useEffect(() => {
    if (!mounted) return;
    const isAdmin = user?.role === "admin";
    const isLoginPage = pathname === "/login";
    // Apply admin theme to login page so the branding is consistent before auth
    const themeToApply = (isAdmin || isLoginPage) ? adminTheme : "quantum";
    document.body.setAttribute("data-theme", themeToApply);
  }, [mounted, adminTheme, user?.role, pathname]);

  // Apply typography to <body> and load dynamic fonts
  useEffect(() => {
    if (!mounted) return;
    const isAdmin = user?.role === "admin";
    const isLoginPage = pathname === "/login";
    // Only admins or the login page get the customized typography vibe
    const vibeToApply = (isAdmin || isLoginPage) ? adminTypographyVibe : "quantum-tech";
    document.body.setAttribute("data-typography", vibeToApply);
    
    // Apply table density setting
    const densityToApply = userPreferences?.tableDensity || 'comfortable';
    document.body.setAttribute("data-density", densityToApply);

    // Dynamically load font stylesheet if it has a specific URL
    const vibeDef = TYPOGRAPHY_VIBES.find((v) => v.id === vibeToApply);
    if (vibeDef && vibeDef.fontUrl) {
      const linkId = `typography-font-${vibeDef.id}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = vibeDef.fontUrl;
        document.head.appendChild(link);
      }
    }
  }, [mounted, adminTypographyVibe, user?.role, pathname]);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        router.push("/login");
      }
    }
  }, [mounted, isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-[var(--theme-bg-deep,#1B102B)]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--theme-bg-deep)] relative z-0">
      {/* Global Background — theme-aware deep color */}
      <div className="fixed inset-0 z-[-2]" style={{ backgroundColor: 'var(--theme-bg-deep, #1B102B)', transition: 'background-color 0.4s ease' }} />

      {/* Subtle Dark Mesh Grid */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      {/* Floating Glowing Orbs — use theme orb colors */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        {/* Top Right Orb — accent primary */}
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-[120px] animate-[float-slow_15s_ease-in-out_infinite] transition-all duration-700"
          style={{ background: 'var(--theme-orb-primary)' }}
        />
        {/* Bottom Left Orb — accent secondary */}
        <div
          className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full blur-[100px] animate-[float-medium_10s_ease-in-out_infinite] transition-all duration-700"
          style={{ background: 'var(--theme-orb-secondary)' }}
        />
        {/* Center Subtle Orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-40 transition-all duration-700"
          style={{ background: 'var(--theme-orb-primary)' }}
        />
      </div>

      {/* Main Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main View Area */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 w-full max-w-full overflow-x-hidden transition-all duration-400 ease-out",
          sidebarCollapsed ? "pl-[104px]" : "pl-[104px] md:pl-[272px]"
        )}
      >
        <TopBar />
        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
        <PermissionDeniedModal />
      </div>
    </div>
  );
}
