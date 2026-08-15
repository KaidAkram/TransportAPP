"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bus,
  FileText,
  AlertTriangle,
  Calendar,
  Gauge,
  Plus,
  Clock,
  ShieldCheck,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
  Wrench,
  UserCheck,
  X,
  Eye,
  ExternalLink,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddDocumentModal } from "@/components/modules/vehicules/AddDocumentModal";
import { AddConstatModal } from "@/components/modules/vehicules/AddConstatModal";
import { AddInterventionModal } from "@/components/modules/maintenance/AddInterventionModal";
import { GlassDocumentManager } from "@/components/shared/GlassDocumentManager";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { VehiculeDetail } from "@/types/vehicule";

export default function VehiculeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [vehicule, setVehicule] = useState<VehiculeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "documents" | "constats" | "maintenance">("infos");
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isConstatModalOpen, setIsConstatModalOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type?: string } | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<VehiculeDetail>(`/vehicules/${resolvedParams.id}`);
      setVehicule(res.data);
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--color-turbo)]/20 blur-[40px] rounded-full w-20 h-20" />
          <Bus className="h-10 w-10 animate-bounce text-[var(--color-turbo)] relative z-10" />
        </div>
        <p className="text-sm text-white/50 font-accent uppercase tracking-widest">Chargement de la fiche véhicule...</p>
      </div>
    );
  }

  if (!vehicule) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
        </div>
        <h2 className="text-lg font-heading font-bold text-white">Véhicule introuvable</h2>
        <Link
          href="/vehicules"
          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all"
        >
          Retour au parc automobile
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "infos" as const, label: "Fiche Technique", icon: Bus, count: null },
    { key: "documents" as const, label: "Documents", icon: FileText, count: vehicule.documents.length },
    { key: "constats" as const, label: "Constats & Sinistres", icon: AlertTriangle, count: vehicule.constats.length },
    { key: "maintenance" as const, label: "Maintenance & Pièces", icon: Wrench, count: vehicule.interventions?.length || 0 },
  ];

  // Info row helper
  const InfoRow = ({ label, value, mono = false, bold = false }: { label: string; value: React.ReactNode; mono?: boolean; bold?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-xs text-white ${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div className="flex items-center gap-4">
          <Link
            href="/vehicules"
            className="flex items-center px-3 py-2 rounded-xl text-sm font-medium glass-panel border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Retour au parc
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-black text-white tracking-tight">
                {vehicule.immatriculation}
              </h1>
              <StatusBadge status={vehicule.statut} />
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              {vehicule.marque} {vehicule.modele} · {vehicule.type} · {vehicule.nombre_places} places
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center px-4 py-2 rounded-xl text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 text-[var(--color-electric-violet)]" />
            Ajouter Document
          </button>
          <button
            onClick={() => setIsInterventionModalOpen(true)}
            className="flex items-center px-4 py-2 rounded-xl text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all group"
          >
            <Wrench className="h-3.5 w-3.5 mr-1.5 text-[var(--color-electric-violet)] group-hover:text-white transition-colors" />
            + Ordre de Travail
          </button>
          <button
            onClick={() => setIsConstatModalOpen(true)}
            className="flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Déclarer Constat
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-6 py-5 flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Kilométrage Actuel</p>
            <span className="text-2xl font-heading font-extrabold text-white font-mono">
              {vehicule.kilometrage_actuel.toLocaleString("fr-FR")} <span className="text-sm text-white/50">km</span>
            </span>
            <p className="text-[10px] text-white/40 mt-1">Dernier relevé compteur</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5">
            <Gauge className="h-5 w-5 text-white/60" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Statut Documentaire</p>
            <span className="text-2xl font-heading font-extrabold text-white font-mono">
              {vehicule.documents_valides} / {vehicule.documents.length}
            </span>
            {vehicule.documents_alertes > 0 ? (
              <p className="text-[10px] text-[var(--color-turbo)] font-bold mt-1">{vehicule.documents_alertes} expire(nt) bientôt</p>
            ) : vehicule.documents_expires > 0 ? (
              <p className="text-[10px] text-rose-400 font-bold mt-1">{vehicule.documents_expires} expiré(s)</p>
            ) : (
              <p className="text-[10px] text-emerald-400 mt-1">Tous les documents sont valides</p>
            )}
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Sinistres & Accidents</p>
            <span className="text-2xl font-heading font-extrabold text-white font-mono">
              {vehicule.total_constats}
            </span>
            <p className="text-[10px] text-white/40 mt-1">Constats déclarés enregistrés</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20">
            <AlertTriangle className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Coût Cumulé (TCO)</p>
            <span className="text-2xl font-heading font-extrabold text-white font-mono">
              {vehicule.cout_total.toLocaleString("fr-FR")} <span className="text-sm text-white/50">DZD</span>
            </span>
            <p className="text-[10px] text-white/40 mt-1">Maintenance & réparations</p>
          </div>
          <div className="p-3 bg-[var(--color-electric-violet)]/10 rounded-full border border-[var(--color-electric-violet)]/20">
            <DollarSign className="h-5 w-5 text-[var(--color-electric-violet)]" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 glass-panel p-1.5 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[var(--color-turbo)]" : ""}`} />
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[9px] font-accent font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-[var(--color-turbo)]/20 text-[var(--color-turbo)]" : "bg-white/5 text-white/40"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: INFORMATIONS */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
          <div className="glass-panel p-6">
            <div className="mb-5">
              <h3 className="text-base font-heading font-bold text-white">Caractéristiques Générales</h3>
              <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mt-0.5">Données constructeur et spécifications</p>
            </div>
            <div>
              <InfoRow label="Immatriculation" value={vehicule.immatriculation} mono bold />
              <InfoRow label="Marque" value={vehicule.marque} />
              <InfoRow label="Modèle" value={vehicule.modele} />
              <InfoRow label="Catégorie / Type" value={vehicule.type} />
              <InfoRow label="Capacité assise" value={`${vehicule.nombre_places} places`} mono />
              <InfoRow label="Année modèle" value={vehicule.annee || "Non renseignée"} mono />
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="mb-5">
              <h3 className="text-base font-heading font-bold text-white">Exploitation & Suivi Opérationnel</h3>
              <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mt-0.5">Mise en service et état du compteur</p>
            </div>
            <div>
              <InfoRow label="Date 1ère mise en circulation" value={vehicule.date_mise_circulation || "Non renseignée"} mono />
              <InfoRow label="Kilométrage actuel" value={`${vehicule.kilometrage_actuel.toLocaleString("fr-FR")} km`} mono bold />
              <InfoRow label="Statut opérationnel" value={<StatusBadge status={vehicule.statut} />} />
              <InfoRow label="Coût total maintenance (TCO)" value={`${vehicule.cout_total.toLocaleString("fr-FR")} DZD`} mono bold />
              <InfoRow label="Date d&apos;enregistrement système" value={new Date(vehicule.created_at).toLocaleDateString("fr-FR")} mono />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Papiers réglementaires, contrôle technique et assurance avec alertes d&apos;expiration.
            </p>
          </div>

          {vehicule.documents.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm font-bold text-white">Aucun document rattaché</p>
              <p className="text-xs text-white/40 mt-1">
                Ajoutez l&apos;assurance, la carte grise ou le contrôle technique pour suivre leur validité.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicule.documents.map((doc) => {
                const isExpired = doc.statut_validite === "Expiré";
                const isWarning = doc.statut_validite === "Expire bientôt";

                return (
                  <div
                    key={doc.id}
                    className="glass-panel overflow-hidden group cursor-pointer hover:bg-white/[0.03] transition-all"
                    onClick={() => setPreviewFile({ url: `${API_BASE_URL}/documents/${doc.id}/view`, name: doc.nom, type: doc.type })}
                  >
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-heading font-bold text-white truncate">{doc.nom}</h4>
                        <p className="text-[10px] text-white/40">{doc.type}</p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-accent font-bold uppercase tracking-wider ${
                          isExpired
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : isWarning
                            ? "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border border-[var(--color-turbo)]/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {doc.statut_validite || "Valide"}
                      </span>
                    </div>
                    <div className="p-4 space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-white/40">Émission</span>
                        <span className="font-mono text-white/80">{doc.date_emission || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-white/40">Expiration</span>
                        <span
                          className={`font-mono font-bold ${
                            isExpired ? "text-rose-400" : isWarning ? "text-[var(--color-turbo)]" : "text-white"
                          }`}
                        >
                          {doc.date_expiration || "Sans expiration"}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile({ url: `${API_BASE_URL}/documents/${doc.id}/view`, name: doc.nom, type: doc.type });
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-[var(--color-electric-violet)] font-medium hover:bg-white/10 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> Voir
                        </button>
                        <a
                          href={`${API_BASE_URL}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-white/70 font-medium hover:bg-white/10 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Télécharger
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONSTATS & SINISTRES */}
      {activeTab === "constats" && (
        <div className="space-y-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Historique des accidents, déclarations d&apos;assurance et dommages matériels enregistrés.
            </p>
            <button
              onClick={() => setIsConstatModalOpen(true)}
              className="flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Nouvelle Déclaration
            </button>
          </div>

          {vehicule.constats.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white">Aucun sinistre déclaré</p>
              <p className="text-xs text-white/40 mt-1">
                Ce véhicule n&apos;a aucun accident ou dommage matériel consigné dans le registre.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicule.constats.map((c) => (
                <div key={c.id} className="glass-panel overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-rose-500/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                      </div>
                      <h4 className="text-xs font-heading font-bold text-rose-300">
                        Sinistre du {new Date(c.date).toLocaleDateString("fr-FR")} {c.heure ? `à ${c.heure}` : ""}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">{c.lieu}</span>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    <div>
                      <p className="font-accent text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Circonstances</p>
                      <p className="text-white/80 bg-white/5 p-3 rounded-xl border border-white/5">
                        {c.circonstances}
                      </p>
                    </div>
                    <div>
                      <p className="font-accent text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Dommages constatés</p>
                      <p className="text-white/80 bg-white/5 p-3 rounded-xl border border-white/5">
                        {c.dommages}
                      </p>
                    </div>
                    {c.tiers_implique && (
                      <div className="p-3 rounded-xl bg-[var(--color-turbo)]/5 border border-[var(--color-turbo)]/20">
                        <p className="font-accent text-[10px] uppercase tracking-widest text-[var(--color-turbo)] mb-1">Tiers impliqué</p>
                        <p className="text-white/80 text-xs">{c.infos_tiers || "Informations non détaillées"}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MAINTENANCE & GMAO */}
      {activeTab === "maintenance" && (
        <div className="space-y-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Historique complet des ordres de travail, réparations et pièces détachées consommées.
            </p>
            <button
              onClick={() => setIsInterventionModalOpen(true)}
              className="flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[var(--color-electric-violet)]/90 hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] transition-all"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouvel Ordre de Travail
            </button>
          </div>

          {(!vehicule.interventions || vehicule.interventions.length === 0) ? (
            <div className="glass-panel p-12 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wrench className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm font-bold text-white">Aucune intervention enregistrée</p>
              <p className="text-xs text-white/40 mt-1">
                Les ordres de travail de vidange, freinage ou réparations apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="min-w-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-6 py-4 text-[10px] font-accent uppercase tracking-widest text-white/50">N° OT</th>
                      <th className="px-6 py-4 text-[10px] font-accent uppercase tracking-widest text-white/50">Catégorie</th>
                      <th className="px-6 py-4 text-[10px] font-accent uppercase tracking-widest text-white/50">Mécanicien</th>
                      <th className="px-6 py-4 text-[10px] font-accent uppercase tracking-widest text-white/50">Date & KM</th>
                      <th className="px-6 py-4 text-[10px] font-accent uppercase tracking-widest text-white/50">Travaux</th>
                      <th className="px-6 py-4 text-[10px] font-accent uppercase tracking-widest text-white/50">Coût</th>
                      <th className="px-6 py-4 text-[10px] font-accent uppercase tracking-widest text-white/50">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {vehicule.interventions.map((it) => (
                      <tr key={it.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-[var(--color-electric-violet)]">
                          {it.numero}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-white">
                          {it.categorie}
                        </td>
                        <td className="px-6 py-4 text-xs text-white/60">
                          {it.mecanicien_nom || "Atelier"}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-white/60">
                          <div>{new Date(it.date).toLocaleDateString("fr-FR")}</div>
                          <div className="text-[10px] text-white/40 font-bold">
                            {it.kilometrage.toLocaleString("fr-DZ")} KM
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-white/80 max-w-[250px] truncate" title={it.travail_effectue || ""}>
                          {it.travail_effectue || "Révision générale"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-white">
                          {it.cout_total.toLocaleString("fr-DZ")} DZD
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-accent font-bold uppercase tracking-wider ${
                              it.statut === "TERMINEE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border border-[var(--color-turbo)]/20"
                            }`}
                          >
                            {it.statut === "TERMINEE" ? "Terminée" : it.statut}
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

      {/* Modal Dialogs */}
      <AddDocumentModal
        vehiculeId={vehicule.id}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddConstatModal
        vehiculeId={vehicule.id}
        isOpen={isConstatModalOpen}
        onClose={() => setIsConstatModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddInterventionModal
        defaultVehiculeId={vehicule.id}
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />

      {/* Global File Upload */}
      <div className="mt-2 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.4s' }}>
        <GlassDocumentManager
          entityType="vehicule"
          entityId={vehicule.id}
          title="Fichiers & Documents Joints"
          subtitle="Gérez les copies scannées (Carte Grise, Assurance, Photos, etc.)"
        />
      </div>

      {/* File Preview Lightbox */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[85vh] mx-4 glass-panel overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02] shrink-0">
                <div>
                  <h3 className="text-sm font-heading font-bold text-white">{previewFile.name}</h3>
                  {previewFile.type && (
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mt-0.5">{previewFile.type}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white/70 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                  </a>
                  <a
                    href={previewFile.url}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white/70 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> Télécharger
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[400px]">
                {previewFile.url && (previewFile.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || previewFile.type?.toLowerCase().includes("photo") || previewFile.type?.toLowerCase().includes("image")) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl"
                  />
                ) : previewFile.url?.match(/\.pdf$/i) ? (
                  <iframe
                    src={previewFile.url}
                    className="w-full h-[70vh] rounded-xl border border-white/10"
                    title={previewFile.name}
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                      <FileText className="h-10 w-10 text-white/20" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Aperçu non disponible</p>
                      <p className="text-xs text-white/40 mt-1">Ce type de fichier ne peut pas être prévisualisé en ligne.</p>
                    </div>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[var(--color-electric-violet)]/90 hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] transition-all"
                    >
                      <Download className="h-4 w-4" /> Télécharger le fichier
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
