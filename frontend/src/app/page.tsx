"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bus,
  Users,
  FileText,
  Shield,
  Wrench,
  Package,
  Activity,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldAlert,
  Percent,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { DashboardResponse, AlertsResponse, AlertItem } from "@/types/dashboard";
import { useSettingsStore } from "@/stores/settingsStore";

// Modals
import { AddVehicleModal } from "@/components/modules/vehicules/AddVehicleModal";
import { AddInterventionModal } from "@/components/modules/maintenance/AddInterventionModal";
import { AddStockEntryModal } from "@/components/modules/stock/AddStockEntryModal";
import { AddCautionModal } from "@/components/modules/cautions/AddCautionModal";
import { AddContractModal } from "@/components/modules/contrats/AddContractModal";
import { Portal } from "@/components/shared/Portal";

// Bento Chart Components
import { MainChartBento } from "@/components/dashboard/MainChartBento";
import { DonutChartBento, DonutData } from "@/components/dashboard/DonutChartBento";

export default function DashboardHomePage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { company } = useSettingsStore();

  // Modal States
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isStockEntryModalOpen, setIsStockEntryModalOpen] = useState(false);
  const [isCautionModalOpen, setIsCautionModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, alertsRes] = await Promise.all([
        api.get<DashboardResponse>("/dashboard"),
        api.get<AlertsResponse>("/alertes"),
        new Promise(resolve => setTimeout(resolve, 1200)) // Ensures the animation is visible for at least 1.2s
      ]);
      setData(dashRes.data);
      setAlerts(alertsRes.data.items);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpi = data?.kpi;

  // Nested Donut Chart Data for Drill-Down
  const vehiclesData: DonutData[] = [
    { 
      name: "Disponibles", value: kpi?.vehicules.disponibles || 14, color: "var(--color-turbo)",
      details: [
        { name: "Au Dépôt", value: 10, color: "var(--color-turbo)" },
        { name: "En Transit", value: 4, color: "#FF8A00" } // Vivid Orange
      ]
    },
    { 
      name: "En Mission", value: kpi?.vehicules.en_mission || 0, color: "var(--color-electric-violet)",
      details: [
        { name: "Trajet Court", value: 0, color: "var(--color-electric-violet)" },
        { name: "Longue Distance", value: 0, color: "#06B6D4" } // Cyan
      ]
    },
    { 
      name: "En Atelier", value: kpi?.vehicules.en_maintenance || 2, color: "#FFFFFF",
      details: [
        { name: "Panne Moteur", value: 1, color: "#FFFFFF" },
        { name: "Révision", value: 1, color: "#A78BFA" } // Soft Purple
      ]
    },
  ];

  const contractsData: DonutData[] = [
    { 
      name: "Actifs", value: kpi?.contrats.total_actifs || 11, color: "var(--color-electric-violet)",
      details: [
        { name: "Moins de 6 mois", value: 4, color: "var(--color-electric-violet)" },
        { name: "Plus de 6 mois", value: 7, color: "#06B6D4" } // Cyan
      ]
    },
    { 
      name: "Suspendus/Expirés", value: 3, color: "rgba(255,255,255,0.4)",
      details: [
        { name: "Suspendus", value: 1, color: "#FFFFFF" },
        { name: "Expirés", value: 2, color: "#EF4444" } // Red
      ]
    },
  ];

  const globalHealthData: DonutData[] = [
    { 
      name: "Opérations Optimales", value: 75, color: "var(--color-electric-violet)",
      details: [
        { name: "Missions à l'heure", value: 45, color: "var(--color-electric-violet)" },
        { name: "Véhicules Dispo", value: 30, color: "#06B6D4" } // Cyan
      ]
    },
    { 
      name: "En Attente", value: 15, color: "var(--color-turbo)",
      details: [
        { name: "Validations", value: 10, color: "var(--color-turbo)" },
        { name: "Paiements", value: 5, color: "#FF8A00" } // Vivid Orange
      ]
    },
    { 
      name: "Alertes / Critiques", value: 10, color: "#FFFFFF",
      details: [
        { name: "Stock Rupture", value: 6, color: "#EF4444" }, // Red
        { name: "Pannes Lourdes", value: 4, color: "#A78BFA" } // Soft Purple
      ]
    },
  ];

  return (
    <>
      {/* Full-Screen Refresh Animation */}
      <AnimatePresence>
        {loading && data && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-xl"
          >
            <div className="relative flex items-center justify-center mb-6">
              <div className="flex items-center justify-center w-24 h-24 relative z-10 rounded-2xl overflow-hidden shadow-[0_0_30px_var(--theme-orb-primary)] bg-[var(--theme-glass)] border border-[var(--theme-border)]">
                {company.logoBase64 ? (
                  <img src={company.logoBase64} alt="Company Logo" className="w-full h-full object-cover mix-blend-screen" />
                ) : (
                  <img src="/animated-logo.gif" alt="Software Logo" className="w-full h-full object-cover mix-blend-screen" />
                )}
              </div>
              {/* Orbital rings */}
              <div className="absolute w-32 h-32 border border-[var(--theme-orb-secondary)] rounded-full animate-[spin_3s_linear_infinite]" />
              <div className="absolute w-40 h-40 border border-dashed border-[var(--theme-orb-primary)] rounded-full animate-[spin_4s_linear_infinite_reverse]" />
            </div>
            <h2 className="text-xl font-heading font-bold text-white tracking-widest uppercase mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              Synchronisation
            </h2>
            <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" /> Mise à jour des systèmes en temps réel...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 max-w-[1600px] mx-auto p-6 font-sans mt-4 contain-layout">
      {/* Top Welcome Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Tableau de Bord Exécutif — {company.name}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-[var(--theme-glass)] border border-[var(--theme-border)] shadow-[0_0_10px_var(--theme-orb-primary)] overflow-hidden">
              {company.logoBase64 ? (
                <img src={company.logoBase64} alt="Company Logo" className="w-full h-full object-cover mix-blend-screen" />
              ) : (
                <img src="/animated-logo.gif" alt="Software Logo" className="w-full h-full object-cover mix-blend-screen" />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-heading font-bold tracking-tight text-white drop-shadow-md flex items-center gap-2">
                Centre de Commandement
              </h1>
              <span className="font-brand text-[14px] font-normal text-white/50 tracking-wide mt-1">
                {company.name === 'Fl\u014d' ? 'Fl\u014d' : company.name} \u2014 Fleet Management & BI
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-turbo)]/20 border border-[var(--color-turbo)]/30 px-3 py-1 text-xs font-accent font-bold text-[var(--color-turbo)] shadow-[0_0_15px_rgba(240,225,0,0.3)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-turbo)] animate-pulse" />
              Opérationnel
            </span>
          </div>
          <p className="text-sm text-white/60 mt-1 font-sans">
            Supervision temps réel · Alger, Algérie ({new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })})
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center px-4 py-2 rounded-xl text-sm font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all group"
        >
          <RefreshCw className={`h-4 w-4 mr-2 text-[var(--color-turbo)] transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
          Actualiser
        </button>
      </div>

      {/* Action Rapides */}
      <div 
        className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        style={{ animationDelay: '0.1s' }}
      >
        <span className="text-xs font-bold text-white/50 uppercase tracking-widest font-accent pl-2">
          Actions Rapides
        </span>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={() => setIsVehicleModalOpen(true)} className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-[var(--color-electric-violet)]/20 hover:border-[var(--color-electric-violet)]/50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Plus className="h-3 w-3 inline mr-1 text-[var(--color-electric-violet)]" /> Véhicule
          </button>
          <button onClick={() => setIsInterventionModalOpen(true)} className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-[var(--color-electric-violet)]/20 hover:border-[var(--color-electric-violet)]/50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Wrench className="h-3 w-3 inline mr-1 text-[var(--color-electric-violet)]" /> Ordre Travail
          </button>
          <button onClick={() => setIsStockEntryModalOpen(true)} className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-[var(--color-turbo)]/20 hover:border-[var(--color-turbo)]/50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Package className="h-3 w-3 inline mr-1 text-[var(--color-turbo)]" /> Entrée Stock
          </button>
          <button onClick={() => setIsCautionModalOpen(true)} className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-[var(--color-electric-violet)]/20 hover:border-[var(--color-electric-violet)]/50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Shield className="h-3 w-3 inline mr-1 text-[var(--color-electric-violet)]" /> Caution
          </button>
          <button onClick={() => setIsContractModalOpen(true)} className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-[var(--color-electric-violet)]/20 hover:border-[var(--color-electric-violet)]/50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <FileText className="h-3 w-3 inline mr-1 text-[var(--color-electric-violet)]" /> Contrat
          </button>
        </div>
      </div>

      {/* Executive KPI Grid (Separated Cards) */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        style={{ animationDelay: '0.2s' }}
      >
        <Link href="/vehicules" className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Flotte Totale</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpi?.vehicules.total || 16}</span>
              <span className="text-xs text-[var(--color-turbo)] font-bold">Actifs</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <Bus className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link href="/employes" className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Ressources Humaines</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpi?.employes.total || 24}</span>
              <span className="text-xs text-[var(--color-electric-violet)] font-bold">Agents</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <Users className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link href="/contrats" className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Conventions Actives</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpi?.contrats.total_actifs || 14}</span>
              <span className="text-xs text-[var(--color-electric-violet)] font-bold">En cours</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <FileText className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link href="/cautions" className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Encours Cautionné</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-heading font-extrabold text-white tracking-tight">{(kpi?.cautions.total_encours_dzd || 4500000).toLocaleString("fr-DZ")}</span>
              <span className="text-[10px] text-white/50 font-bold">DZD</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <Shield className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </Link>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Feature A: Main Chart (Span 2 cols) */}
        <div className="md:col-span-2 lg:col-span-2 row-span-2 min-h-[400px]">
          <MainChartBento />
        </div>

        {/* Feature B: Vehicle Donut */}
        <div className="md:col-span-1 lg:col-span-1 min-h-[200px]">
          <DonutChartBento 
            title="État du Parc" 
            subtitle="Répartition opérationnelle" 
            data={vehiclesData} 
            totalLabel="Véhicules"
          />
        </div>

        {/* Feature C: Contracts Donut */}
        <div className="md:col-span-1 lg:col-span-1 min-h-[200px]">
          <DonutChartBento 
            title="Conventions" 
            subtitle="Statut des contrats" 
            data={contractsData} 
            totalLabel="Contrats"
          />
        </div>

        {/* NEW: Feature E: Global Recap Health % (Col Span 1) */}
        <div className="md:col-span-1 lg:col-span-1 min-h-[200px] opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.6s' }}>
          <DonutChartBento 
            title="Santé Globale ERP" 
            subtitle="Score de performance (%)" 
            data={globalHealthData} 
            totalLabel="%"
          />
        </div>

        {/* Feature F: Extra Small Bento Box (Stock) (Col Span 1) */}
        <div className="md:col-span-1 lg:col-span-1 min-h-[200px] glass-panel p-6 flex flex-col justify-between group overflow-hidden opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-heading font-bold text-white tracking-wide">État du Stock</h3>
              <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mt-0.5">Disponibilité</p>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-white group-hover:bg-[var(--color-turbo)]/10 group-hover:text-[var(--color-turbo)] transition-colors">
              <Package className="h-4 w-4" />
            </div>
          </div>
          
          {/* Visual Health Bar */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              {/* Rupture Segment */}
              <div 
                className="h-full bg-[var(--color-turbo)]" 
                style={{ width: `${Math.max(5, ((kpi?.stock.stock_rupture || 0) / Math.max(1, ((kpi?.stock.stock_rupture || 0) + (kpi?.stock.stock_faible || 0) + (kpi?.stock.stock_normal || 1)))) * 100)}%`, boxShadow: '0 0 10px var(--color-turbo)' }}
              />
              {/* Faible Segment */}
              <div 
                className="h-full bg-white/40 border-l border-[var(--color-haiti)]" 
                style={{ width: `${((kpi?.stock.stock_faible || 0) / Math.max(1, ((kpi?.stock.stock_rupture || 0) + (kpi?.stock.stock_faible || 0) + (kpi?.stock.stock_normal || 1)))) * 100}%` }}
              />
              {/* Normal Segment */}
              <div 
                className="h-full bg-[var(--color-electric-violet)] border-l border-[var(--color-haiti)]" 
                style={{ width: `${((kpi?.stock.stock_normal || 1) / Math.max(1, ((kpi?.stock.stock_rupture || 0) + (kpi?.stock.stock_faible || 0) + (kpi?.stock.stock_normal || 1)))) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Metrics */}
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-[10px] font-accent uppercase text-[var(--color-turbo)] tracking-widest mb-0.5">Rupture</p>
              <p className="text-xl font-heading font-bold text-[var(--color-turbo)] leading-none drop-shadow-[0_0_5px_rgba(240,225,0,0.5)]">{kpi?.stock.stock_rupture || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-0.5">Faible</p>
              <p className="text-lg font-heading font-bold text-white/80 leading-none">{kpi?.stock.stock_faible || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-accent uppercase text-[var(--color-electric-violet)] tracking-widest mb-0.5">Normal</p>
              <p className="text-xl font-heading font-bold text-[var(--color-electric-violet)] leading-none">{kpi?.stock.stock_normal || 17}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature D: Alerts & Activity (Bottom Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.8s' }}>
        
        {/* Left Column: Live Alerts & Compliance */}
        <div className="glass-panel flex flex-col h-[400px]">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--color-turbo)]/20 p-2 rounded-xl border border-[var(--color-turbo)]/30">
                <ShieldAlert className="h-5 w-5 text-[var(--color-turbo)]" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-white">Centre des Alertes</h3>
                <p className="text-[11px] text-white/50">Contrôles réglementaires & stocks critiques</p>
              </div>
            </div>
            <span className="text-[10px] font-accent text-[var(--color-turbo)] bg-[var(--color-turbo)]/10 border border-[var(--color-turbo)]/20 px-2 py-1 rounded-md uppercase tracking-widest">
              {alerts.length} alerte(s)
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <CheckCircle2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-white">Flotte 100% Conforme</p>
                <p className="text-xs text-white/40 mt-1">Aucune expiration ou anomalie détectée.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((al) => {
                  const isUrgent = al.severity === "URGENT";
                  return (
                    <Link
                      key={al.id}
                      href={al.link}
                      className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                    >
                      <div className="space-y-1.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[9px] font-accent uppercase tracking-widest ${
                              isUrgent
                                ? "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                                : "bg-white/5 text-white/80 border-white/10"
                            }`}
                          >
                            {al.badge_label}
                          </span>
                          <p className="text-xs font-bold text-white group-hover:text-[var(--color-turbo)] transition-colors">
                            {al.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-white/50 line-clamp-1">{al.message}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white group-hover:-rotate-45 transition-all shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="glass-panel flex flex-col h-[400px]">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--color-electric-violet)]/20 p-2 rounded-xl border border-[var(--color-electric-violet)]/30">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-white">Journal d&apos;Activité</h3>
                <p className="text-[11px] text-white/50">Flux opérationnel en temps réel</p>
              </div>
            </div>
            <span className="text-[10px] font-accent text-white/40 border border-white/10 px-2 py-1 rounded-md uppercase tracking-widest">
              Live
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {(!data?.recent_activity || data.recent_activity.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <p className="text-xs text-white/40">Aucune activité récente.</p>
              </div>
            ) : (
              <div className="space-y-2 relative before:absolute before:inset-y-4 before:left-6 before:w-px before:bg-gradient-to-b before:from-white/20 before:to-transparent">
                {data.recent_activity.map((act) => (
                  <Link
                    key={act.id}
                    href={act.link}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group relative"
                  >
                    {/* Timeline Node */}
                    <div className="relative mt-1">
                      <div className="h-3 w-3 rounded-full bg-[var(--color-haiti)] border-[2px] border-white/40 group-hover:border-white transition-all z-10 relative" />
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-accent uppercase tracking-wider ${
                              act.badge_variant === "warning"
                                ? "bg-[var(--color-turbo)] text-black"
                                : act.badge_variant === "success"
                                ? "bg-[var(--color-electric-violet)] text-white"
                                : "bg-white/5 text-white/80 border border-white/10"
                            }`}
                          >
                            {act.badge_label}
                          </span>
                          <p className="text-xs font-bold text-white group-hover:text-[var(--color-electric-violet)] transition-colors">
                            {act.title}
                          </p>
                        </div>
                        <span className="text-[9px] font-accent text-white/30 tracking-widest shrink-0">
                          {new Date(act.date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50">{act.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Shortcut Modals */}
      <Portal>
        <AddVehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          onSuccess={() => fetchDashboardData()}
        />
        <AddInterventionModal
          isOpen={isInterventionModalOpen}
          onClose={() => setIsInterventionModalOpen(false)}
          onSuccess={() => fetchDashboardData()}
        />
        <AddStockEntryModal
          isOpen={isStockEntryModalOpen}
          onClose={() => setIsStockEntryModalOpen(false)}
          onSuccess={() => fetchDashboardData()}
        />
        <AddCautionModal
          isOpen={isCautionModalOpen}
          onClose={() => setIsCautionModalOpen(false)}
          onSuccess={() => fetchDashboardData()}
        />
        <AddContractModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          onSuccess={() => fetchDashboardData()}
        />
      </Portal>
    </div>
    </>
  );
}
