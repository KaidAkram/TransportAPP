"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";
import { Settings, Bell, User, Monitor, CheckCircle2, Globe, LayoutList, Database, HardDrive, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export default function UserSettingsPage() {
  const { userPreferences, updatePreferences } = useSettingsStore();
  const { user } = useAuthStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state to prevent hydration mismatch for theme
  const [mounted, setMounted] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsLastUpdated, setStatsLastUpdated] = useState<Date | null>(null);

  const fetchSystemStats = async () => {
    if (user?.role !== 'admin') return;
    try {
      setIsStatsLoading(true);
      const res = await api.get<any>("/admin/system/storage-usage");
      setSystemStats(res.data);
      setStatsLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load system stats", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (user?.role === 'admin') {
      fetchSystemStats();
    }
  }, [user]);

  const handleLanguageChange = (language: 'fr' | 'en' | 'ar') => {
    updatePreferences({ language });
    setToastMessage(`Langue modifiée : ${language.toUpperCase()}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDensityChange = (tableDensity: 'compact' | 'comfortable') => {
    updatePreferences({ tableDensity });
    setToastMessage(`Densité modifiée : ${tableDensity === 'compact' ? 'Compact' : 'Confortable'}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleNotificationToggle = () => {
    updatePreferences({ notificationsEnabled: !userPreferences.notificationsEnabled });
    setToastMessage(
      userPreferences.notificationsEnabled
        ? "Notifications désactivées"
        : "Notifications activées"
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--color-turbo)] text-[#2B1B54] px-4 py-3 rounded-2xl shadow-xl shadow-[var(--color-turbo)]/20 border border-[var(--color-turbo)] flex items-center gap-2.5 text-sm font-bold animate-scale-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-accent text-[var(--color-turbo)] uppercase tracking-widest mb-1 block font-bold">
            Profil Utilisateur
          </span>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight drop-shadow-md flex items-center gap-3">
            <Settings className="h-8 w-8 text-[var(--color-turbo)]" />
            Mes Préférences
          </h1>
          <p className="text-sm text-white/60 mt-2 max-w-xl">
            Gérez vos paramètres d'affichage, vos préférences de notifications et consultez les informations de votre profil.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Summary */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-heading font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-4 h-4 text-white/60" />
            Mon Profil
          </h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] font-bold text-2xl flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              {user ? user.email.slice(0, 2).toUpperCase() : "USR"}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.email || "utilisateur@etransport.dz"}</p>
              <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70 uppercase tracking-widest border border-white/5">
                Rôle : {user?.role || "Gestionnaire"}
              </span>
            </div>
          </div>
          <p className="text-xs text-white/40 mt-6 leading-relaxed">
            Les informations de votre profil sont gérées par votre administrateur. Veuillez le contacter si vous souhaitez modifier votre adresse email ou vos droits d'accès.
          </p>
        </div>

        {/* UI Preferences */}
        <div className="space-y-6">
          {/* Language Selection */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-white/60" />
              Langue de l'interface
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  userPreferences.language === 'fr'
                    ? "bg-[var(--color-electric-violet)]/20 border-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.2)]"
                    : "bg-black/20 border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-xl">🇫🇷</span>
                <span className="text-xs font-bold">Français</span>
              </button>
              
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  userPreferences.language === 'en'
                    ? "bg-[var(--color-electric-violet)]/20 border-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.2)]"
                    : "bg-black/20 border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-xl">🇬🇧</span>
                <span className="text-xs font-bold">Anglais</span>
              </button>
              
              <button
                onClick={() => handleLanguageChange('ar')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  userPreferences.language === 'ar'
                    ? "bg-[var(--color-electric-violet)]/20 border-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.2)]"
                    : "bg-black/20 border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-xl">🇩🇿</span>
                <span className="text-xs font-bold">Arabe</span>
              </button>
            </div>
            {userPreferences.language !== 'fr' && (
              <p className="text-[10px] text-[var(--color-turbo)] mt-3 text-center uppercase tracking-widest font-accent opacity-80">
                La traduction {userPreferences.language === 'en' ? 'anglaise' : 'arabe'} sera implémentée prochainement.
              </p>
            )}
          </div>

          {/* Table Density */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
              <LayoutList className="w-4 h-4 text-white/60" />
              Densité d'affichage (Tableaux)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDensityChange('comfortable')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  userPreferences.tableDensity === 'comfortable'
                    ? "bg-[var(--color-electric-violet)]/20 border-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.2)]"
                    : "bg-black/20 border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex flex-col gap-1 w-full max-w-[80px] mb-1">
                  <div className="h-2 w-full bg-white/20 rounded"></div>
                  <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                  <div className="h-2 w-full bg-white/20 rounded mt-1"></div>
                </div>
                <span className="text-xs font-bold">Confortable</span>
              </button>
              
              <button
                onClick={() => handleDensityChange('compact')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  userPreferences.tableDensity === 'compact'
                    ? "bg-[var(--color-electric-violet)]/20 border-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.2)]"
                    : "bg-black/20 border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex flex-col gap-0.5 w-full max-w-[80px] mb-1">
                  <div className="h-1.5 w-full bg-white/20 rounded"></div>
                  <div className="h-1.5 w-3/4 bg-white/20 rounded"></div>
                  <div className="h-1.5 w-full bg-white/20 rounded"></div>
                  <div className="h-1.5 w-5/6 bg-white/20 rounded"></div>
                  <div className="h-1.5 w-full bg-white/20 rounded"></div>
                </div>
                <span className="text-xs font-bold">Compact</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-white/60" />
                Notifications Sonores
              </h3>
              <p className="text-xs text-white/40 mt-1">
                Jouer un son lors d'une nouvelle notification ou alerte
              </p>
            </div>
            <button
              type="button"
              onClick={handleNotificationToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                userPreferences.notificationsEnabled ? "bg-[var(--color-turbo)]" : "bg-black/60 border border-white/20"
              }`}
            >
              <span className="sr-only">Activer les notifications</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  userPreferences.notificationsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

      </div>

      {/* Storage & System Health (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="glass-panel p-6 rounded-2xl mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[var(--color-turbo)]" />
                Storage & System Health
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Monitor database and file storage consumption against free tier limits.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {statsLastUpdated && (
                <span className="text-[10px] text-white/40">
                  Last updated: {statsLastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchSystemStats}
                disabled={isStatsLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isStatsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {!systemStats && isStatsLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-white/5 rounded-xl"></div>
              <div className="h-12 bg-white/5 rounded-xl"></div>
            </div>
          ) : systemStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Database Storage */}
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[var(--color-electric-violet)]" />
                    <span className="text-sm font-bold text-white">Database Storage</span>
                  </div>
                  <span className="text-xs font-mono text-white/80">
                    {systemStats.database.used_formatted} / {systemStats.database.free_tier_limit_formatted}
                  </span>
                </div>
                
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden relative z-10">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      systemStats.database.usage_percentage > 90 ? 'bg-red-500' :
                      systemStats.database.usage_percentage > 75 ? 'bg-yellow-500' :
                      'bg-[var(--color-electric-violet)]'
                    }`}
                    style={{ width: `${Math.min(systemStats.database.usage_percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center relative z-10 text-[10px]">
                  <span className="text-white/40">PostgreSQL (Supabase)</span>
                  <span className="text-white/80 font-bold">{systemStats.database.usage_percentage}% Used</span>
                </div>

                {systemStats.database.usage_percentage > 90 && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Upgrade Recommended</span>
                  </div>
                )}
              </div>

              {/* File Storage */}
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">File Storage</span>
                  </div>
                  <span className="text-xs font-mono text-white/80">
                    {systemStats.file_storage.used_formatted} / {systemStats.file_storage.free_tier_limit_formatted}
                  </span>
                </div>
                
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden relative z-10">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      systemStats.file_storage.usage_percentage > 90 ? 'bg-red-500' :
                      systemStats.file_storage.usage_percentage > 75 ? 'bg-yellow-500' :
                      'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(systemStats.file_storage.usage_percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center relative z-10 text-[10px]">
                  <span className="text-white/40">Storage Buckets</span>
                  <span className="text-white/80 font-bold">{systemStats.file_storage.usage_percentage}% Used</span>
                </div>

                {systemStats.file_storage.usage_percentage > 90 && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Upgrade Recommended</span>
                  </div>
                )}
              </div>

              {/* Server Metrics (Small info pill) */}
              <div className="md:col-span-2 mt-2 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-[10px]">
                <div className="px-3 py-1.5 rounded-full bg-white/5 flex items-center gap-2 border border-white/5">
                  <Monitor className="w-3 h-3 text-white/40" />
                  <span className="text-white/60">Server Memory: </span>
                  <span className="text-white font-mono font-bold">{systemStats.server.memory_usage_mb} MB</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/5 flex items-center gap-2 border border-white/5">
                  <HardDrive className="w-3 h-3 text-white/40" />
                  <span className="text-white/60">Server Disk: </span>
                  <span className="text-white font-mono font-bold">{systemStats.server.disk_used_formatted} / {systemStats.server.disk_total_formatted}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Failed to load system metrics. Check connection.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
