"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { GlassDocumentManager } from "@/components/shared/GlassDocumentManager";
import { api } from "@/lib/api";
import { CautionDetail } from "@/types/caution";

export default function CautionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [caution, setCaution] = useState<CautionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "documents">("infos");

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<CautionDetail>(`/cautions/${resolvedParams.id}`);
      setCaution(res.data);
    } catch (err) {
      console.error("Error fetching caution details:", err);
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
        <ShieldCheck className="h-8 w-8 animate-pulse text-[var(--color-electric-violet)]" />
        <p className="text-xs text-white/50">Chargement de la caution...</p>
      </div>
    );
  }

  if (!caution) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Caution introuvable</h2>
        <Link href="/cautions" className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
          Retour au registre des cautions
        </Link>
      </div>
    );
  }

  const isDemande = caution.type === "DEMANDE";
  const isBonneExec = caution.type === "BONNE_EXECUTION";
  const montantFormate = caution.montant.toLocaleString("fr-DZ");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-3 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <Link
          href="/cautions"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold">
            Détail Caution
          </p>
          <h1 className="text-xl font-heading font-extrabold text-white">{caution.numero}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: "0.1s" }}>
        {(["infos", "documents"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${
              activeTab === tab
                ? "bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border-[var(--color-electric-violet)]/30"
                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab === "infos" ? "Informations" : "Documents"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: "0.2s" }}>
        {activeTab === "infos" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type & Status */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Type de Garantie
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                      isDemande
                        ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        : isBonneExec
                        ? "bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border-[var(--color-electric-violet)]/20"
                        : "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                    }`}
                  >
                    {isDemande ? "Demande" : isBonneExec ? "Bonne Exécution" : "Soumission"}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{caution.objet}</p>
              </div>

              {/* Financial Details */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-6 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Montant Garanti
                </h3>
                <div className="text-3xl font-heading font-extrabold text-[var(--color-electric-violet)]">
                  {montantFormate} <span className="text-lg text-white/40">{caution.devise}</span>
                </div>
              </div>

              {/* Documents Manager */}
              <GlassDocumentManager entityType="caution" entityId={caution.id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Clock className="w-32 h-32 text-white" />
                </div>
                <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Dates
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 font-bold">Émission</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {new Date(caution.date_emission).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {caution.date_echeance && (
                    <div>
                      <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] font-bold">Échéance</p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {new Date(caution.date_echeance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank & Client */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Banque & Client
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 font-bold">Banque Émettrice</p>
                    <p className="text-sm font-bold text-white mt-0.5">{caution.banque_emetteur || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 font-bold">Bénéficiaire</p>
                    <p className="text-sm font-bold text-white mt-0.5">{caution.client_nom || "—"}</p>
                  </div>
                  {caution.societe_nom && (
                    <div>
                      <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 font-bold">Société</p>
                      <p className="text-sm font-bold text-white mt-0.5">{caution.societe_nom}</p>
                    </div>
                  )}
                  {caution.numero_compte_bancaire && (
                    <div>
                      <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 font-bold">N° Compte</p>
                      <p className="text-sm font-mono font-bold text-white mt-0.5">{caution.numero_compte_bancaire}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 font-bold">Référence</p>
                    <p className="text-sm font-bold text-white mt-0.5">{caution.contrat_reference || caution.reference_numero || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Statut
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                    caution.statut === "CHEZ_CLIENT"
                      ? "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                      : caution.statut === "RETOURNEE" || caution.statut === "MAIN_LEVEE"
                      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                      : "bg-white/5 text-white/50 border-white/10"
                  }`}
                >
                  {caution.statut === "CHEZ_CLIENT"
                    ? "Chez le Client"
                    : caution.statut === "RETOURNEE"
                    ? "Retournée"
                    : caution.statut === "MAIN_LEVEE"
                    ? "Mainlevée"
                    : "Création"}
                </span>
              </div>

              {/* PDF Download */}
              {caution.url_caution_pdf && (
                <a
                  href={caution.url_caution_pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-panel p-4 rounded-2xl flex items-center gap-3 hover:bg-white/[0.04] transition-colors border border-white/10"
                >
                  <div className="p-2 rounded-xl bg-[var(--color-electric-violet)]/10">
                    <Download className="h-4 w-4 text-[var(--color-electric-violet)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Télécharger le PDF</p>
                    <p className="text-[10px] text-white/40">Acte officiel de caution</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <GlassDocumentManager entityType="caution" entityId={caution.id} />
        )}
      </div>
    </div>
  );
}
