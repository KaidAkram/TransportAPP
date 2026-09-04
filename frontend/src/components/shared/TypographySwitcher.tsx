"use client";

import { useSettingsStore, TYPOGRAPHY_VIBES, TypographyVibeId } from "@/stores/settingsStore";
import { Type } from "lucide-react";

export function TypographySwitcher() {
  const { adminTypographyVibe, setAdminTypographyVibe, saveGlobalSettings } = useSettingsStore();

  const handleSelect = async (vibeId: TypographyVibeId) => {
    setAdminTypographyVibe(vibeId);
    await saveGlobalSettings();
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-[var(--theme-border)] mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--theme-orb-primary)] flex items-center justify-center">
          <Type className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-black text-white">Personnalité Typographique</h2>
          <p className="text-sm text-[var(--theme-text-muted)] mt-1 font-sans">
            Choisissez l&apos;ambiance des polices de caractères de l&apos;interface.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TYPOGRAPHY_VIBES.map((vibe) => {
          const isActive = adminTypographyVibe === vibe.id;
          return (
            <button
              key={vibe.id}
              onClick={() => handleSelect(vibe.id)}
              className={`relative text-start p-4 rounded-2xl border transition-all duration-300 overflow-hidden group ${
                isActive
                  ? "bg-[var(--theme-glass-hover)] border-[var(--theme-accent-primary)] shadow-[0_0_20px_var(--theme-orb-primary)]"
                  : "bg-[var(--theme-glass)] border-[var(--theme-border)] hover:bg-[var(--theme-glass-hover)] hover:border-white/20"
              }`}
            >
              {/* Active glow */}
              {isActive && (
                <div className="absolute top-0 end-0 w-16 h-16 bg-[var(--theme-accent-primary)]/20 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
              )}

              <div className="relative z-10 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">{vibe.name}</h3>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-[var(--theme-accent-primary)] shadow-[0_0_8px_var(--theme-accent-primary)]" />
                  )}
                </div>

                <p className="text-[10px] uppercase tracking-widest text-[var(--theme-text-muted)] font-bold">
                  {vibe.vibe}
                </p>


              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
