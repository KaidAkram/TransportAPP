"use client";

import Link from "next/link";
import { Home, Search, Map } from "lucide-react";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import { translations, SupportedLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { userPreferences } = useSettingsStore();
  const currentLang = (userPreferences?.language as SupportedLanguage) || "fr";
  const t = translations[currentLang] || translations.fr;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 font-sans">
      <div className="relative mb-8 flex justify-center items-center">
        {/* Subtle Background glow */}
        <div className="absolute inset-0 bg-[var(--color-electric-violet)]/10 blur-[80px] rounded-full transform scale-150" />
        <div className="absolute inset-0 bg-[var(--color-turbo)]/5 blur-[60px] rounded-full transform scale-110 translate-y-4" />
        
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="relative z-10 flex items-center justify-center w-32 h-32 rounded-3xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_30px_rgba(131,77,251,0.1)] glass-panel"
        >
          <Map className="w-12 h-12 text-[var(--color-electric-violet)]/80" />
        </motion.div>

        {/* Decorative 404 text */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute -top-6 -end-6 text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-turbo)] to-rose-400 opacity-90 drop-shadow-[0_0_15px_rgba(240,225,0,0.3)] z-20 select-none"
        >
          404
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto space-y-4 relative z-10"
      >
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">
          {t.notFoundTitle}
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          {t.notFoundDesc}
        </p>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#9d6cfc] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_20px_rgba(131,77,251,0.3)] transition-all flex items-center justify-center gap-2 group"
          >
            <Home className="w-4 h-4" />
            {t.btnDashboard}
          </Link>
          <button
            onClick={() => {
              // Trigger topbar global search (Ctrl+K logic)
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
              window.dispatchEvent(event);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium glass-panel border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center justify-center gap-2 group"
          >
            <Search className="w-4 h-4 text-white/50 group-hover:text-[var(--color-turbo)] transition-colors" />
            {t.btnSearch}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
