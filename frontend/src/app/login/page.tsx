"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bus, ShieldCheck, UserCheck, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore, AuthUser } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { AnimatePresence, motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { company } = useSettingsStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Veuillez saisir votre identifiant et mot de passe.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        access_token: string;
        token_type: string;
        user: AuthUser;
      }>("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      if (res.data && res.data.access_token) {
        await login(res.data.access_token, res.data.user);
        router.push("/");
      }
    } catch (err: any) {
      setError(
        err.detail ||
          err.message ||
          "Identifiants invalides. Veuillez vérifier votre nom d'utilisateur et mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType: "admin" | "gestionnaire") => {
    setUsername(userType);
    setPassword("123");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[var(--theme-bg-deep,#1B102B)]">
      {/* Subtle Background Glows (Theme Aware) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-40 transition-colors duration-700" style={{ backgroundColor: 'var(--theme-orb-primary)' }} />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-30 transition-colors duration-700" style={{ backgroundColor: 'var(--theme-orb-secondary)' }} />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {mounted && company.logoBase64 ? (
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl shadow-lg shadow-[var(--theme-orb-primary)] mb-2 overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-glass)]">
              <img src={company.logoBase64} alt={company.name} className="w-full h-full object-cover mix-blend-screen" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl shadow-lg shadow-[var(--theme-orb-primary)] mb-2 overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-glass)]">
              <img src="/animated-logo.gif" alt="Software Logo" className="w-full h-full object-cover mix-blend-screen" />
            </div>
          )}
          
          <h1 className="text-3xl font-brand font-normal text-white tracking-wide" style={{ textShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
            {mounted ? (company.name === 'Fl\u014d' ? 'Fl\u014d' : company.name) : "Fl\u014d"}
          </h1>
          <p className="text-[11px] font-sans text-slate-400 uppercase tracking-[0.2em] font-medium">
            Fleet Management & BI
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle noise over the card */}
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--theme-bg-deep)]/90 backdrop-blur-md rounded-2xl"
              >
                <div className="flex items-center justify-center w-20 h-20 relative rounded-2xl overflow-hidden shadow-[0_0_30px_var(--theme-orb-primary)] bg-[var(--theme-glass)] border border-[var(--theme-border)] mb-4">
                  {mounted && company.logoBase64 ? (
                    <img src={company.logoBase64} alt={company.name} className="w-full h-full object-cover mix-blend-screen" />
                  ) : (
                    <img src="/animated-logo.gif" alt="Software Logo" className="w-full h-full object-cover mix-blend-screen" />
                  )}
                </div>
                <div className="absolute w-28 h-28 border border-[var(--theme-orb-secondary)] rounded-full animate-[spin_3s_linear_infinite]" />
                <div className="absolute w-36 h-36 border border-dashed border-[var(--theme-orb-primary)] rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                <h3 className="text-sm font-heading font-bold text-white tracking-widest uppercase mt-4">
                  Authentification...
                </h3>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-400 flex items-start gap-2">
              <span className="font-bold"></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 relative z-10">
              <label className="block text-xs font-heading font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                Identifiant
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin ou gestionnaire"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-deep)]/50 text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] text-sm focus:outline-none focus:border-[var(--theme-accent-primary)] focus:ring-1 focus:ring-[var(--theme-accent-primary)] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 relative z-10">
              <label className="block text-xs font-heading font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-deep)]/50 text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] text-sm focus:outline-none focus:border-[var(--theme-accent-primary)] focus:ring-1 focus:ring-[var(--theme-accent-primary)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-white font-heading font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 relative z-10"
              style={{ backgroundColor: "var(--theme-accent-primary)" }}
            >
              {loading ? "Vérification..." : "Se connecter"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Fill Demo Badges */}
          <div className="pt-4 border-t border-[var(--theme-border)] space-y-3 relative z-10">
            <p className="text-[11px] font-accent font-bold text-[var(--theme-text-muted)] uppercase tracking-widest text-center">
              Comptes Démonstration (1-Clic)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-primary-base">
                  <ShieldCheck className="h-4 w-4 text-primary-base" /> Admin
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">admin / 123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("gestionnaire")}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-emerald-400">
                  <UserCheck className="h-4 w-4 text-emerald-400" /> Gestionnaire
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">gestionnaire / 123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          Système Sécurisé ERP Transport • République Algérienne Démocratique et Populaire
        </div>
      </div>
    </div>
  );
}
