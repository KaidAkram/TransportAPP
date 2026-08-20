"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Receipt, Calendar, CreditCard, Download, CheckCircle2, Clock, AlertCircle, Ban, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { Facture } from "@/types/finance";

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  EN_ATTENTE: { label: "En attente", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock },
  PAYEE: { label: "Payée", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
  EN_RETARD: { label: "En retard", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: AlertCircle },
  ANNULEE: { label: "Annulée", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: Ban },
};

export default function FactureDetailPage() {
  const { id } = useParams();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<Facture>(`/factures/${id}`)
      .then(res => setFacture(res.data))
      .catch(err => setError(err.detail || "Facture non trouvée"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="glass-panel p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !facture) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="glass-panel p-12 text-center">
          <p className="text-white/60">{error || "Facture non trouvée"}</p>
          <Link href="/finances" className="mt-4 inline-block text-emerald-400 text-sm hover:underline">Retour</Link>
        </div>
      </div>
    );
  }

  const statutCfg = STATUT_CONFIG[facture.statut] || STATUT_CONFIG.EN_ATTENTE;
  const StatutIcon = statutCfg.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 lg:p-8 contain-layout">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/finances" className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] font-accent uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
              <Receipt className="w-3 h-3" /> Détail Facture
            </p>
            <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
              {facture.numero}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border font-accent uppercase tracking-wider text-[10px] font-bold ${statutCfg.color} ${statutCfg.bg} ${statutCfg.border}`}>
            <StatutIcon className="h-3.5 w-3.5" />
            {statutCfg.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="glass-panel p-6">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4">Informations Client</h3>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Building2 className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <p className="font-medium text-white">{facture.client_nom || "Client"}</p>
                <p className="text-xs text-white/40 font-mono mt-0.5">ID: {facture.client_id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="glass-panel p-6">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4">Détails de Règlement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase font-bold">Mode de Règlement</p>
                <p className="text-white mt-1 font-medium">{facture.mode_reglement || "Non défini"}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[10px] text-white/40 uppercase font-bold">Date de Règlement</p>
                <p className="text-white mt-1 font-mono">{facture.date_reglement || "—"}</p>
              </div>
            </div>
            {facture.url_document_reglement && (
              <div className="mt-4">
                <a
                  href={facture.url_document_reglement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Download className="h-4 w-4" /> Document Justificatif
                </a>
              </div>
            )}
          </div>

          {/* Remarques */}
          {facture.remarques && (
            <div className="glass-panel p-6">
              <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4">Remarques</h3>
              <p className="text-sm text-white/70 leading-relaxed">{facture.remarques}</p>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold mb-4">Résumé</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Date Facture</span>
                <span className="font-mono text-white/80">{facture.date_facture}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Mois Réalisation</span>
                <span className="text-white/80 font-medium">{facture.mois_realisation}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-xs font-accent uppercase tracking-widest text-white/50">Montant Facture</span>
                <span className="text-2xl font-heading font-extrabold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                  {facture.montant_facture.toLocaleString("fr-FR")} <span className="text-xs font-sans text-white/40 font-normal">DZD</span>
                </span>
              </div>
            </div>
          </div>

          <div className={`glass-panel p-6 border ${statutCfg.border}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${statutCfg.bg}`}>
                <StatutIcon className={`h-5 w-5 ${statutCfg.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-accent uppercase tracking-widest text-white/40">Statut</p>
                <p className={`text-sm font-bold ${statutCfg.color}`}>{statutCfg.label}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
