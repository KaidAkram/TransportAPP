"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bus,
  Users,
  Building2,
  Wrench,
  Shield,
  FileText,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { DashboardResponse, AlertsResponse, AlertItem } from "@/types/dashboard";

// Modals
import { AddVehicleModal } from "@/components/modules/vehicules/AddVehicleModal";
import { AddInterventionModal } from "@/components/modules/maintenance/AddInterventionModal";
import { AddStockEntryModal } from "@/components/modules/stock/AddStockEntryModal";
import { AddCautionModal } from "@/components/modules/cautions/AddCautionModal";
import { AddContractModal } from "@/components/modules/contrats/AddContractModal";

export default function DashboardHomePage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & System Status Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Centre de Commandement ERP
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success-text">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Opérationnel
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Supervision temps réel · Alger, Algérie ({new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="text-xs border-border h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <Card className="bg-surface border-border shadow-xs">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
              Actions Rapides :
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsVehicleModalOpen(true)}
                className="text-xs border-border h-8 hover:bg-primary-light/30"
              >
                <Plus className="h-3 w-3 mr-1 text-primary-base" /> + Véhicule
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsInterventionModalOpen(true)}
                className="text-xs border-border h-8 hover:bg-primary-light/30"
              >
                <Wrench className="h-3 w-3 mr-1 text-primary-base" /> + Ordre de Travail
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsStockEntryModalOpen(true)}
                className="text-xs border-border h-8 hover:bg-success-bg text-success"
              >
                <Package className="h-3 w-3 mr-1" /> + Entrée Stock
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCautionModalOpen(true)}
                className="text-xs border-border h-8 hover:bg-warning-bg text-warning"
              >
                <Shield className="h-3 w-3 mr-1" /> + Caution
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsContractModalOpen(true)}
                className="text-xs border-border h-8 hover:bg-primary-light/30"
              >
                <FileText className="h-3 w-3 mr-1 text-primary-base" /> + Contrat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6 Executive Module KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: Véhicules */}
        <Link href="/vehicules" className="group">
          <Card className="bg-surface border-border shadow-xs hover:border-primary-base/50 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-text-primary group-hover:text-primary-base transition-colors">
                    Parc Automobile
                  </CardTitle>
                  <CardDescription className="text-[11px]">Flotte & État Opérationnel</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-text-primary">
                  {kpi?.vehicules.total || 0}
                </span>
                <span className="text-xs text-text-secondary">Véhicules sous gestion</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border text-center">
                <div className="p-1 rounded bg-success-bg/40">
                  <p className="text-[10px] text-success-text font-semibold">Dispo</p>
                  <p className="font-mono text-xs font-bold text-success">{kpi?.vehicules.disponibles || 0}</p>
                </div>
                <div className="p-1 rounded bg-warning-bg/40">
                  <p className="text-[10px] text-warning-text font-semibold">Mission</p>
                  <p className="font-mono text-xs font-bold text-warning">{kpi?.vehicules.en_mission || 0}</p>
                </div>
                <div className="p-1 rounded bg-danger-bg/40">
                  <p className="text-[10px] text-danger-text font-semibold">Atelier</p>
                  <p className="font-mono text-xs font-bold text-danger">{kpi?.vehicules.en_maintenance || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Module 2: Employés */}
        <Link href="/employes" className="group">
          <Card className="bg-surface border-border shadow-xs hover:border-primary-base/50 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-text-primary group-hover:text-primary-base transition-colors">
                    Ressources Humaines
                  </CardTitle>
                  <CardDescription className="text-[11px]">Chauffeurs & Mécaniciens (STI)</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-text-primary">
                  {kpi?.employes.total || 0}
                </span>
                <span className="text-xs text-text-secondary">Effectif Total Actif</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-center">
                <div className="p-1 rounded bg-table-header">
                  <p className="text-[10px] text-text-secondary font-semibold">Chauffeurs Bus/PL</p>
                  <p className="font-mono text-xs font-bold text-primary-base">{kpi?.employes.chauffeurs || 0}</p>
                </div>
                <div className="p-1 rounded bg-table-header">
                  <p className="text-[10px] text-text-secondary font-semibold">Mécaniciens Atelier</p>
                  <p className="font-mono text-xs font-bold text-primary-base">{kpi?.employes.mecaniciens || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Module 3: Partenaires CRM */}
        <Link href="/partenaires" className="group">
          <Card className="bg-surface border-border shadow-xs hover:border-primary-base/50 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-text-primary group-hover:text-primary-base transition-colors">
                    Partenaires CRM
                  </CardTitle>
                  <CardDescription className="text-[11px]">Clients & Fournisseurs</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-text-primary">
                  {kpi?.partenaires.total || 0}
                </span>
                <span className="text-xs text-text-secondary">Comptes d&apos;Affaires</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-center">
                <div className="p-1 rounded bg-table-header">
                  <p className="text-[10px] text-text-secondary font-semibold">Clients Entreprises</p>
                  <p className="font-mono text-xs font-bold text-success">{kpi?.partenaires.clients || 0}</p>
                </div>
                <div className="p-1 rounded bg-table-header">
                  <p className="text-[10px] text-text-secondary font-semibold">Fournisseurs Pièces</p>
                  <p className="font-mono text-xs font-bold text-primary-base">{kpi?.partenaires.fournisseurs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Module 4: Contrats */}
        <Link href="/contrats" className="group">
          <Card className="bg-surface border-border shadow-xs hover:border-primary-base/50 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-text-primary group-hover:text-primary-base transition-colors">
                    Marchés & Conventions
                  </CardTitle>
                  <CardDescription className="text-[11px]">Contrats & Avenants</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-text-primary">
                  {kpi?.contrats.total_actifs || 0}
                </span>
                <span className="text-xs text-text-secondary">Contrats en cours</span>
              </div>
              <div className="p-1.5 rounded bg-table-header border border-border flex justify-between items-center text-xs">
                <span className="text-text-secondary text-[11px]">Volume d&apos;Affaires :</span>
                <span className="font-mono font-bold text-primary-base">
                  {(kpi?.contrats.total_volume_dzd || 0).toLocaleString("fr-DZ")} DZD
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Module 5: Cautions */}
        <Link href="/cautions" className="group">
          <Card className="bg-surface border-border shadow-xs hover:border-primary-base/50 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-bg text-warning">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-text-primary group-hover:text-primary-base transition-colors">
                    Cautions Bancaires
                  </CardTitle>
                  <CardDescription className="text-[11px]">Garanties BNA / CPA & PDF</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-warning">
                  {kpi?.cautions.total_chez_client || 0}
                </span>
                <span className="text-xs text-text-secondary">Cautions chez les clients</span>
              </div>
              <div className="p-1.5 rounded bg-table-header border border-border flex justify-between items-center text-xs">
                <span className="text-text-secondary text-[11px]">Encours Cautionné :</span>
                <span className="font-mono font-bold text-warning">
                  {(kpi?.cautions.total_encours_dzd || 0).toLocaleString("fr-DZ")} DZD
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Module 6: Stock & Maintenance */}
        <Link href="/stock" className="group">
          <Card className="bg-surface border-border shadow-xs hover:border-primary-base/50 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-text-primary group-hover:text-primary-base transition-colors">
                    Magasin Stock & GMAO
                  </CardTitle>
                  <CardDescription className="text-[11px]">Pièces & Déductions Atelier</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold font-mono text-text-primary">
                  {kpi?.stock.total_references || 0}
                </span>
                <span className="text-xs text-text-secondary">Références au magasin</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border text-center">
                <div className="p-1 rounded bg-success-bg/40">
                  <p className="text-[10px] text-success-text font-semibold">Normal</p>
                  <p className="font-mono text-xs font-bold text-success">{kpi?.stock.stock_normal || 0}</p>
                </div>
                <div className="p-1 rounded bg-warning-bg/40">
                  <p className="text-[10px] text-warning-text font-semibold">Faible</p>
                  <p className="font-mono text-xs font-bold text-warning">{kpi?.stock.stock_faible || 0}</p>
                </div>
                <div className="p-1 rounded bg-danger-bg/40">
                  <p className="text-[10px] text-danger-text font-semibold">Rupture</p>
                  <p className="font-mono text-xs font-bold text-danger">{kpi?.stock.stock_rupture || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Columns: Left = Live Alerts Center, Right = Activity Timeline Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Alerts & Compliance */}
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 border-b border-border bg-table-header flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <div>
                <CardTitle className="text-sm font-semibold text-text-primary">
                  Centre des Alertes & Échéances
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Contrôles réglementaires, fins de validité et stocks critiques
                </CardDescription>
              </div>
            </div>
            <span className="text-xs font-bold text-text-secondary">
              {alerts.length} alerte(s)
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-text-primary">Flotte et Dossiers 100% Conformes</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Aucune expiration ou rupture de stock nécessitant une intervention.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                {alerts.map((al) => {
                  const isUrgent = al.severity === "URGENT";

                  return (
                    <Link
                      key={al.id}
                      href={al.link}
                      className="flex items-start justify-between p-3.5 hover:bg-primary-light/20 transition-colors group"
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                              isUrgent
                                ? "bg-danger-bg text-danger-text"
                                : "bg-warning-bg text-warning-text"
                            }`}
                          >
                            {al.badge_label}
                          </span>
                          <p className="text-xs font-bold text-text-primary group-hover:text-primary-base transition-colors">
                            {al.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-text-secondary line-clamp-1">{al.message}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Recent Activity Feed */}
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 border-b border-border bg-table-header flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-base" />
              <div>
                <CardTitle className="text-sm font-semibold text-text-primary">
                  Journal d&apos;Activité Récente
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Flux opérationnel des ordres de travail, stocks et conventions
                </CardDescription>
              </div>
            </div>
            <span className="text-xs text-text-secondary">Temps réel</span>
          </CardHeader>
          <CardContent className="p-0">
            {(!data?.recent_activity || data.recent_activity.length === 0) ? (
              <div className="p-8 text-center text-xs text-text-secondary">
                Aucune activité récente enregistrée.
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                {data.recent_activity.map((act) => (
                  <Link
                    key={act.id}
                    href={act.link}
                    className="flex items-center justify-between p-3.5 hover:bg-primary-light/20 transition-colors group"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                            act.badge_variant === "warning"
                              ? "bg-warning-bg text-warning-text"
                              : act.badge_variant === "success"
                              ? "bg-success-bg text-success-text"
                              : "bg-primary-light text-primary-base"
                          }`}
                        >
                          {act.badge_label}
                        </span>
                        <p className="text-xs font-semibold text-text-primary group-hover:text-primary-base transition-colors">
                          {act.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-1">{act.description}</p>
                    </div>
                    <span className="text-[10px] font-mono text-text-secondary shrink-0">
                      {new Date(act.date).toLocaleDateString("fr-FR")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Shortcut Modals */}
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
    </div>
  );
}
