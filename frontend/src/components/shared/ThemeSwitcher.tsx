"use client";

import { useSettingsStore, THEMES, ThemeId } from "@/stores/settingsStore";
import { CheckCircle2, Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { adminTheme, setAdminTheme } = useSettingsStore();

  const handleSelect = (themeId: ThemeId) => {
    setAdminTheme(themeId);
    // Instantly apply to body
    document.body.setAttribute("data-theme", themeId);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-sm font-heading font-bold text-white mb-1 flex items-center gap-2">
        <Palette className="w-4 h-4" style={{ color: 'var(--theme-accent-primary)' }} />
        Thème de l'Interface
      </h3>
      <p className="text-[10px] font-accent uppercase tracking-widest mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        Personnalisez l'esthétique visuelle de votre instance SaaS (Admin uniquement)
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const isActive = adminTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              className={`group relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? "border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.4)] scale-[1.02]"
                  : "border-white/5 hover:border-white/15"
              }`}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${theme.colors.bg}cc, ${theme.colors.bg}88)`
                  : "rgba(255,255,255,0.02)",
                boxShadow: isActive
                  ? `0 0 25px ${theme.colors.primary}33, inset 0 1px 0 rgba(255,255,255,0.1)`
                  : undefined,
              }}
            >
              {/* Color swatch trio */}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-xl shadow-inner flex-shrink-0"
                  style={{ backgroundColor: theme.colors.bg, border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <div
                  className="w-5 h-8 rounded-lg shadow-inner"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-3 h-8 rounded-md shadow-inner"
                  style={{ backgroundColor: theme.colors.secondary, opacity: 0.9 }}
                />
              </div>

              {/* Name + Vibe */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-bold text-white leading-tight truncate">
                  {theme.name}
                </p>
                <p className="text-[9px] font-accent text-white/40 mt-0.5 leading-tight">
                  {theme.vibe}
                </p>
              </div>

              {/* Active check mark */}
              {isActive && (
                <CheckCircle2
                  className="absolute top-3 right-3 w-4 h-4"
                  style={{ color: theme.colors.primary }}
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[9px] font-accent text-white/30 mt-4 text-center uppercase tracking-widest">
        Le changement de thème est instantané et persisté pour les administrateurs
      </p>
    </div>
  );
}
