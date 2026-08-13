"use client";

import { Search, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-6">
      {/* Global Search */}
      <div className="relative w-72 md:w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          id="global-search-input"
          placeholder="Recherche globale (Véhicules, Contrats, Pièces...)"
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base transition-all"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Interactive Alerts Notification Bell */}
        <NotificationBell />

        {/* User Profile / Status */}
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary-base font-semibold text-xs">
            {user ? user.email.slice(0, 2).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-medium text-text-primary">
              {user ? user.email : "Direction Générale"}
            </p>
            <p className="text-[11px] text-text-secondary capitalize">
              {user ? user.role : "Super Administrateur"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
