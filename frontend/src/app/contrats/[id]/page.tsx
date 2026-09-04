"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  FileEdit,
  ShieldCheck,
  Download,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Factory,
} from "lucide-react";
import { AddAvenantModal } from "@/components/modules/contrats/AddAvenantModal";
import { AddCautionModal } from "@/components/modules/cautions/AddCautionModal";
import { AddContractDocumentModal } from "@/components/modules/contrats/AddContractDocumentModal";
import { GlassDocumentManager } from "@/components/shared/GlassDocumentManager";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { ContratDetail } from "@/types/contrat";
import { Portal } from "@/components/shared/Portal";

export default function ContratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contrat, setContrat] = useState<ContratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "avenants" | "cautions" | "documents">("infos");
  const [isAvenantModalOpen, setIsAvenantModalOpen] = useState(false);
  const [isCautionModalOpen, setIsCautionModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ContratDetail>(`/contrats/${resolvedParams.id}`);
      setContrat(res.data);
    } catch (err) {
      console.error("Error fetching contract details:", err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <FileText className="h-8 w-8 animate-pulse text-[var(--color-electric-violet)]" />
        <p className="text-xs text-white/50">Chargement du dossier contractuel...</p>
      </div>
    );
  }

  if (!contrat) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Contrat introuvable</h2>
        <Link href="/contrats" className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
          Retour au registre des contrats
        </Link>
      </div>
    );
  }

  const isClient = contrat.partenaire_role === "CLIENT";
  const isUrgent = contrat.jours_restants !== null && contrat.jours_restants !== undefined && contrat.jours_restants >= 0 && contrat.jours_restants <= 7;
  const isWarning = contrat.jours_restants !== null && contrat.jours_restants !== undefined && contrat.jours_restants > 7 && contrat.jours_restants <= 30;
  const isExpired = contrat.jours_restants !== null && contrat.jours_restants !== undefined && contrat.jours_restants < 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div className="flex flex-col gap-3 flex-1 min-w-0 me-4">
          <Link href="/contrats" className="inline-flex w-fit items-center text-[10px] font-accent uppercase tracking-widest text-white/50 hover:text-[var(--color-electric-violet)] transition-colors">
            <ArrowLeft className="h-3 w-3 me-1" />
            Retour aux contrats
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-heading font-extrabold text-white drop-shadow-md">
                {contrat.reference}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-accent uppercase tracking-widest font-bold ${
                  isClient
                    ? "bg-white/10 text-white"
                    : "bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)]"
                }`}
              >
                {isClient ? <Users className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                {contrat.partenaire_nom}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-accent uppercase tracking-widest font-bold border ${
                  contrat.statut === "ACTIF"
                    ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                    : "bg-white/5 text-white/50 border-white/10"
                }`}
              >
                {contrat.statut}
              </span>
              {isExpired ? (
                <span className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-[10px] font-accent uppercase tracking-widest font-bold text-red-400">
                  Expiré
                </span>
              ) : isUrgent ? (
                <span className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-[10px] font-accent uppercase tracking-widest font-bold text-red-400 animate-pulse">
                  {contrat.alerte_expiration}
                </span>
              ) : isWarning ? (
                <span className="rounded-full bg-[var(--color-turbo)]/10 border border-[var(--color-turbo)]/20 px-3 py-1 text-[10px] font-accent uppercase tracking-widest font-bold text-[var(--color-turbo)]">
                  {contrat.alerte_expiration}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-white/60 font-sans mt-2">
              {contrat.objet}
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2.5 shrink-0">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center px-4 py-2 rounded-xl text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all shadow-sm"
          >
            <FileText className="h-3.5 w-3.5 me-1.5 text-[var(--color-electric-violet)]" />
            Document
          </button>
          <button
            onClick={() => setIsCautionModalOpen(true)}
            className="flex items-center px-4 py-2 rounded-xl text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5 me-1.5 text-[var(--color-turbo)]" />
            Caution
          </button>
          <button
            onClick={() => setIsAvenantModalOpen(true)}
            className="flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#6A3DE8] hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] transition-all"
          >
            <FileEdit className="h-3.5 w-3.5 me-1.5" />
            Nouvel Avenant
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-5 py-4 flex flex-col justify-between hover:bg-white/[0.02] transition-colors rounded-2xl">
          <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Montant Révisé Total</p>
          <p className="text-xl font-heading font-extrabold text-white truncate my-1">
            {contrat.montant_total_avec_avenants.toLocaleString("fr-DZ")} {contrat.devise}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            Initial : {contrat.montant.toLocaleString("fr-DZ")} {contrat.devise}
          </p>
        </div>

        <div className="glass-panel px-5 py-4 flex flex-col justify-between hover:bg-white/[0.02] transition-colors rounded-2xl">
          <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Avenants</p>
          <p className="text-xl font-heading font-extrabold text-[var(--color-electric-violet)] my-1">
            {contrat.avenants.length}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">Modifications validées</p>
        </div>

        <div className="glass-panel px-5 py-4 flex flex-col justify-between hover:bg-white/[0.02] transition-colors rounded-2xl">
          <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Couverture / Caution</p>
          <p className="text-xl font-heading font-extrabold text-[var(--color-turbo)] my-1">
            {contrat.cautions.length}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">Garanties associées</p>
        </div>

        <div className="glass-panel px-5 py-4 flex flex-col justify-between hover:bg-white/[0.02] transition-colors rounded-2xl">
          <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Date de Fin Actuelle</p>
          <p className="text-xl font-heading font-extrabold text-white my-1 truncate">
            {new Date(contrat.date_fin).toLocaleDateString("fr-FR")}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">Prorogations incluses</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        
        {/* Left Column : 2/3 */}
        <div className="xl:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-nowrap border-b border-white/10 pb-px">
            {[
              { id: "infos", label: "Informations Générales", icon: FileText },
              { id: "avenants", label: "Avenants", icon: FileEdit, count: contrat.avenants.length },
              { id: "cautions", label: "Cautions / Garanties", icon: ShieldCheck, count: contrat.cautions.length },
              { id: "documents", label: "Documents", icon: Download, count: contrat.documents.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex flex-1 sm:flex-none justify-center sm:justify-start items-center px-2 sm:px-3 py-2.5 text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
                    isActive ? "text-[var(--color-electric-violet)]" : "text-white/50 hover:text-white"
                  }`}
                >
                  <tab.icon className="hidden sm:block h-3.5 w-3.5 me-1.5" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ms-2 inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[9px] font-mono ${
                      isActive ? "bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)]" : "bg-white/5 text-white/50"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 start-0 end-0 h-0.5 bg-[var(--color-electric-violet)] rounded-t-full shadow-[0_-2px_10px_rgba(131,77,251,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "infos" && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 end-0 p-4 opacity-10">
                    <Building2 className="w-24 h-24 text-[var(--color-electric-violet)]" />
                  </div>
                  <h3 className="text-xs font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-5 flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Détails Partenaire
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Raison Sociale</p>
                      <p className="text-sm font-bold text-white">{contrat.partenaire_nom || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Rôle</p>
                      <p className="text-sm font-bold text-white">{contrat.partenaire_role}</p>
                    </div>
                    {/* These fields might be missing if API doesn't return full partner object inside detail */}
                    <div className="sm:col-span-2">
                      <Link href={`/partenaires`} className="text-[11px] font-bold text-[var(--color-electric-violet)] hover:underline flex items-center gap-1 w-fit">
                        <ArrowLeft className="h-3 w-3" />
                        Voir la fiche partenaire complète
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 end-0 p-4 opacity-10">
                    <FileText className="w-24 h-24 text-[var(--color-turbo)]" />
                  </div>
                  <h3 className="text-xs font-accent uppercase tracking-widest text-[var(--color-turbo)] font-bold mb-5 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Paramètres Contrat
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Type de Contrat</p>
                      <p className="text-sm font-bold text-white">{contrat.type_contrat}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Périodicité Facturation</p>
                      <p className="text-sm font-bold text-white">{contrat.mode_facturation || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Délai Paiement (Jours)</p>
                      <p className="text-sm font-bold text-white font-mono">{contrat.conditions_paiement}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-xs font-accent uppercase tracking-widest text-emerald-400 font-bold mb-5 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Pénalités & Retards
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Taux Pénalité Retard (%)</p>
                      <p className="text-sm font-bold text-white font-mono">{'N/A'}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "avenants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">Avenants Enregistrés</h3>
                  <button
                    onClick={() => setIsAvenantModalOpen(true)}
                    className="flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30 hover:bg-[var(--color-electric-violet)]/20 transition-all"
                  >
                    <Plus className="h-3 w-3 me-1" /> Nouvel Avenant
                  </button>
                </div>
                {contrat.avenants.length === 0 ? (
                  <div className="text-center py-12 glass-panel rounded-2xl">
                    <FileEdit className="h-8 w-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white/80">Aucun avenant</p>
                    <p className="text-xs text-white/40">Ce contrat n'a subi aucune modification.</p>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="min-w-0">
                      <table className="w-full text-start border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02]">
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Réf. Avenant</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Date Signature</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Type Modif</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Nouveau Montant / Fin</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {contrat.avenants.map((a) => (
                            <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-mono text-xs font-bold text-[var(--color-electric-violet)]">{a.numero}</td>
                              <td className="py-3 px-4 text-xs font-mono text-white/70">{new Date(a.date).toLocaleDateString("fr-FR")}</td>
                              <td className="py-3 px-4 text-xs font-medium text-white">{a.objet}</td>
                              <td className="py-3 px-4 text-xs text-white/70 font-mono flex flex-col gap-0.5">
                                {a.modif_montant !== null && (
                                  <span>{a.modif_montant?.toLocaleString("fr-DZ")} DZD</span>
                                )}
                                {a.nouvelle_date_fin && (
                                  <span className="text-[10px] text-[var(--color-turbo)]">
                                    Fin repoussée : {new Date(a.nouvelle_date_fin).toLocaleDateString("fr-FR")}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  true ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-white/5 text-white/50 border border-white/10"
                                }`}>
                                  Validé
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "cautions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">Garanties & Cautions</h3>
                  <button
                    onClick={() => setIsCautionModalOpen(true)}
                    className="flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border border-[var(--color-turbo)]/30 hover:bg-[var(--color-turbo)]/20 transition-all"
                  >
                    <Plus className="h-3 w-3 me-1" /> Nouvelle Caution
                  </button>
                </div>
                {contrat.cautions.length === 0 ? (
                  <div className="text-center py-12 glass-panel rounded-2xl">
                    <ShieldCheck className="h-8 w-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white/80">Aucune caution</p>
                    <p className="text-xs text-white/40">Ce contrat n'a aucune garantie associée.</p>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="min-w-0">
                      <table className="w-full text-start border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02]">
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Réf. Caution</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Type</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Montant</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Banque</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Validité</th>
                            <th className="py-3 px-4 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {contrat.cautions.map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-mono text-xs font-bold text-[var(--color-turbo)]">{c.numero}</td>
                              <td className="py-3 px-4 text-xs font-medium text-white">{c.type}</td>
                              <td className="py-3 px-4 text-xs font-mono text-white">{c.montant.toLocaleString("fr-DZ")}</td>
                              <td className="py-3 px-4 text-xs text-white/70">{"N/A"}</td>
                              <td className="py-3 px-4 text-[11px] font-mono text-white/70">
                                {new Date(c.date_emission).toLocaleDateString("fr-FR")} <br />
                                {new Date(c.date_echeance || '').toLocaleDateString("fr-FR")}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  c.statut === "ACTIF" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-white/5 text-white/50 border border-white/10"
                                }`}>
                                  {c.statut}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                <GlassDocumentManager 
                  entityType="contrat" 
                  entityId={contrat.id} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column : 1/3 (Timeline & Alerts) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 end-0 p-4 opacity-5">
              <Clock className="w-32 h-32 text-white" />
            </div>
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Durée de Vie
            </h3>

            <div className="relative ps-6 border-s-2 border-white/10 space-y-6">
              <div className="relative">
                <div className="absolute w-3 h-3 bg-emerald-400 rounded-full -left-[1.65rem] top-1 shadow-[0_0_10px_rgba(52,211,153,0.5)] border border-emerald-900" />
                <p className="text-[10px] font-accent uppercase tracking-widest text-emerald-400 font-bold">Début du contrat</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {new Date(contrat.date_debut).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {contrat.avenants.map((av, idx) => (
                <div key={av.id} className="relative">
                  <div className="absolute w-2.5 h-2.5 bg-[var(--color-electric-violet)] rounded-full -left-[1.55rem] top-1 shadow-[0_0_10px_rgba(131,77,251,0.5)]" />
                  <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold">Avenant {av.numero}</p>
                  <p className="text-[11px] text-white/70 mt-0.5">{av.objet}</p>
                  <p className="text-[11px] font-mono text-white/50">{new Date(av.date).toLocaleDateString("fr-FR")}</p>
                </div>
              ))}

              <div className="relative">
                <div className={`absolute w-3 h-3 rounded-full -left-[1.65rem] top-1 shadow-[0_0_10px_rgba(0,0,0,0.5)] border ${isExpired ? 'bg-red-500 border-red-900' : 'bg-[var(--color-turbo)] border-[var(--color-turbo)]/30'}`} />
                <p className={`text-[10px] font-accent uppercase tracking-widest font-bold ${isExpired ? 'text-red-400' : 'text-[var(--color-turbo)]'}`}>
                  Échéance Actuelle
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {new Date(contrat.date_fin).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="mt-2">
                  {isExpired ? (
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
                      Expiré depuis {Math.abs(contrat.jours_restants || 0)} jours
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-[var(--color-turbo)]/10 border border-[var(--color-turbo)]/20 text-xs font-bold text-[var(--color-turbo)]">
                      Finit dans {contrat.jours_restants} jours
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes ou Description */}
          {false && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Notes Renouvellement
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Aucune note de renouvellement
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Portal>
      <AddAvenantModal
        isOpen={isAvenantModalOpen}
        onClose={() => setIsAvenantModalOpen(false)}
        onSuccess={() => {
          setIsAvenantModalOpen(false);
          fetchDetail();
        }}
        contratId={contrat.id}
      />
      <AddCautionModal
        isOpen={isCautionModalOpen}
        onClose={() => setIsCautionModalOpen(false)}
        onSuccess={() => {
          setIsCautionModalOpen(false);
          fetchDetail();
        }}
        // In real app, might want to pre-fill the contractId via props or state
      />
      <AddContractDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={() => {
          setIsDocModalOpen(false);
          fetchDetail();
        }}
        contratId={contrat.id}
      />
      </Portal>
    </div>
  );
}
