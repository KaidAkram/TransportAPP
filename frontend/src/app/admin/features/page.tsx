"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  Lock,
  ToggleRight,
  ToggleLeft
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface FeatureToggleItem {
  id: string;
  feature_name: string;
  description: string;
  categorie: string;
  enabled_for_gestionnaire: boolean;
}

interface FeatureToggleListResponse {
  items: FeatureToggleItem[];
  total: number;
}

export default function AdminFeaturesPage() {
  const { user, fetchActiveFeatures } = useAuthStore();
  const [features, setFeatures] = useState<FeatureToggleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<FeatureToggleListResponse>("/admin/features");
      if (res.data && res.data.items) {
        setFeatures(res.data.items);
      }
    } catch (err) {
      console.error("Error loading features:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = async (feature_name: string, currentVal: boolean) => {
    setSavingKey(feature_name);
    try {
      const res = await api.put<FeatureToggleItem>(`/admin/features/${feature_name}`, {
        enabled_for_gestionnaire: !currentVal,
      });

      if (res.data) {
        setFeatures((prev) =>
          prev.map((f) =>
            f.feature_name === feature_name
              ? { ...f, enabled_for_gestionnaire: res.data.enabled_for_gestionnaire }
              : f
          )
        );
        await fetchActiveFeatures();
        showToast(
          `Action "${feature_name}" ${!currentVal ? "activée" : "désactivée"} pour les gestionnaires.`
        );
      }
    } catch (err: any) {
      alert(err.detail || err.message || "Erreur de mise à jour");
    } finally {
      setSavingKey(null);
    }
  };

  const handleBulkCategory = async (categoryName: string, enableAll: boolean) => {
    const categoryFeatures = features.filter((f) => f.categorie === categoryName);
    for (const f of categoryFeatures) {
      if (f.enabled_for_gestionnaire !== enableAll) {
        try {
          await api.put(`/admin/features/${f.feature_name}`, {
            enabled_for_gestionnaire: enableAll,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
    await fetchFeatures();
    await fetchActiveFeatures();
    showToast(
      `Catégorie "${categoryName}": toutes les fonctionnalités ${
        enableAll ? "activées" : "désactivées"
      }.`
    );
  };

  const categories = Array.from(new Set(features.map((f) => f.categorie)));

  const filteredFeatures = features.filter((f) => {
    const matchesCategory = selectedCategory === "ALL" || f.categorie === selectedCategory;
    const matchesSearch =
      !search ||
      f.feature_name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.categorie.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const grouped = categories.reduce((acc, cat) => {
    const items = filteredFeatures.filter((f) => f.categorie === cat);
    if (items.length > 0) {
      acc[cat] = items;
    }
    return acc;
  }, {} as Record<string, FeatureToggleItem[]>);

  if (user && user.role !== "admin") {
    return (
      <div className="p-6 md:p-12 max-w-3xl mx-auto text-center py-20 space-y-4">
        <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-heading font-black text-white">Accès Réservé à l'Administrateur</h2>
        <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
          Seul un profil ayant le rôle <strong className="text-[var(--color-electric-violet)]">Administrateur</strong> peut
          configurer et modifier les autorisations fonctionnelles du système.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 overflow-x-hidden animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 end-6 z-50 bg-[var(--color-electric-violet)] text-white px-4 py-3 rounded-2xl shadow-xl shadow-[#7C3AED]/20 border border-white/20 flex items-center gap-2.5 text-sm font-medium animate-scale-in">
          <Check className="h-5 w-5 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-accent text-[var(--color-electric-violet)] uppercase tracking-widest mb-1 block font-bold">
            Supervision Système
          </span>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight drop-shadow-md flex items-center gap-3">
            <Sliders className="h-8 w-8 text-[var(--color-electric-violet)]" />
            Gestion des Fonctionnalités & Permissions
          </h1>
          <p className="text-sm text-white/60 mt-2 max-w-xl">
            Activez ou désactivez dynamiquement les droits d'action pour le rôle <strong className="text-white">Gestionnaire</strong>.
          </p>
        </div>

        <button
          onClick={fetchFeatures}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl glass-panel text-white hover:bg-white/10 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full no-scrollbar">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.4)]"
                : "bg-black/20 border border-white/10 text-white/50 hover:text-white hover:border-white/30"
            }`}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? "bg-[var(--color-electric-violet)] text-white shadow-[0_0_15px_rgba(131,77,251,0.4)]"
                  : "bg-black/20 border border-white/10 text-white/50 hover:text-white hover:border-white/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer une action..."
            className="w-full ps-10 pe-4 py-2.5 text-sm rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all"
          />
        </div>
      </div>

      {/* Feature List */}
      {loading ? (
        <div className="py-20 text-center text-[var(--color-electric-violet)] text-sm animate-pulse font-bold tracking-widest uppercase">
          Chargement des fonctionnalités...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border border-white/10 p-8">
          <ShieldCheck className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-black text-white">Aucune fonctionnalité trouvée</h3>
          <p className="text-sm text-white/50 mt-1">Modifiez vos critères de recherche.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items], idx) => {
            return (
              <div
                key={category}
                className="glass-panel overflow-hidden max-w-full rounded-2xl animate-[stagger-up_0.2s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Category Header */}
                <div className="flex flex-wrap sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/10 bg-black/20">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading font-black text-base text-white tracking-wide uppercase">{category}</h3>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/10 text-white/70 border border-white/5">
                      {items.length} actions
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-accent tracking-widest uppercase font-bold">
                    <button
                      onClick={() => handleBulkCategory(category, true)}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors hover:underline underline-offset-4"
                    >
                      Tout activer
                    </button>
                    <span className="text-white/20">•</span>
                    <button
                      onClick={() => handleBulkCategory(category, false)}
                      className="text-red-400 hover:text-red-300 transition-colors hover:underline underline-offset-4"
                    >
                      Tout désactiver
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-white/5">
                  {items.map((feat) => {
                    const isEnabled = feat.enabled_for_gestionnaire;
                    const isSaving = savingKey === feat.feature_name;

                    return (
                      <div
                        key={feat.id}
                        className="p-5 px-6 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-1.5">
                            <span className="font-bold text-sm text-white group-hover:text-[var(--color-turbo)] transition-colors">
                              {feat.description}
                            </span>
                            <code className="text-[9px] font-mono font-bold bg-white/10 text-white/70 px-2 py-1 rounded border border-white/10 break-all">
                              {feat.feature_name}
                            </code>
                          </div>
                          <div className="text-[10px] text-white/40 font-accent uppercase tracking-widest flex items-center gap-1.5">
                            Statut : 
                            <span
                              className={`font-bold flex items-center gap-1 ${
                                isEnabled ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {isEnabled ? (
                                <>
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                                  Autorisé
                                </>
                              ) : (
                                <>
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.8)]" />
                                  Verrouillé
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Custom Modern Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggle(feat.feature_name, isEnabled)}
                          disabled={isSaving}
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-electric-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                            isEnabled ? "bg-[var(--color-electric-violet)] shadow-[0_0_15px_rgba(131,77,251,0.5)]" : "bg-black/60 border border-white/20"
                          } ${isSaving ? "opacity-50" : "hover:scale-105"}`}
                        >
                          <span className="sr-only">Toggle feature</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                              isEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

