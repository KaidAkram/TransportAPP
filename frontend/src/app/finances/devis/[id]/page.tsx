"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, Building2, AlignLeft, Send, CheckCircle2 } from "lucide-react";

import { api } from "@/lib/api";
import { Devis } from "@/types/finance";
import { useAuthStore } from "@/stores/authStore";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { GlassDocumentManager } from "@/components/shared/GlassDocumentManager";

export default function DevisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAuthStore();
  const canConvert = hasPermission("edit_devis");
  
  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; isLoading: boolean }>({
    isOpen: false,
    isLoading: false,
  });

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const res = await api.get<Devis>(`/devis/${params.id}`);
      setDevis(res.data);
      setError(null);
    } catch (err: any) {
      setError("Impossible de charger les détails de ce devis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchDevis();
    }
  }, [params.id]);

  const executeConvertDevis = async () => {
    if (!devis) return;
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await api.post(`/devis/${devis.id}/convertir-contrat`, {});
      if (res.data) {
        fetchDevis();
        setConfirmModal({ isOpen: false, isLoading: false });
      }
    } catch (err: any) {
      alert(err.detail || err.message || "Erreur de conversion");
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-turbo)] border-t-transparent animate-spin mb-4" />
        <p className="text-white/50 text-sm font-accent uppercase tracking-widest">Chargement du devis...</p>
      </div>
    );
  }

  if (error || !devis) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour aux finances
        </button>
        <div className="p-8 text-center glass-panel rounded-2xl border border-red-500/20 bg-red-500/5">
          <FileText className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-400">Erreur</h3>
          <p className="text-xs text-white/50 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const badgeConfig = {
    BROUILLON: "bg-white/5 text-white/60 border-white/10",
    ENVOYE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ACCEPTE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REFUSE: "bg-red-500/10 text-red-400 border-red-500/20",
    EXPIRE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  }[devis.statut] || "bg-white/5 text-white/60 border-white/10";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-accent uppercase tracking-widest text-white/40 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Retour aux finances
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight drop-shadow-md">
              Devis {devis.numero}
            </h1>
            <span className={`inline-block px-3 py-1.5 rounded border font-accent uppercase tracking-widest text-[9px] font-bold ${badgeConfig}`}>
              {devis.statut}
            </span>
          </div>
          <p className="text-sm text-white/60 mt-1 flex items-center gap-2">
            Émis le {devis.date_emission} <span className="text-white/20">•</span> Valable jusqu'au {devis.date_validite}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {devis.url_pdf && (
            <a
              href={devis.url_pdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl glass-panel border-white/10 hover:bg-white/10 text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              <Download className="h-4 w-4 text-white/70" />
              Télécharger PDF
            </a>
          )}
          {canConvert && !devis.contrat_id && (
            <button
              onClick={() => setConfirmModal({ isOpen: true, isLoading: false })}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-turbo)]/20 text-[var(--color-turbo)] border border-[var(--color-turbo)]/50 hover:bg-[var(--color-turbo)]/40 hover:border-[var(--color-turbo)] transition-all shadow-[0_0_15px_rgba(255,225,51,0.2)]"
            >
              <CheckCircle2 className="h-4 w-4 text-[var(--color-turbo)]" />
              Convertir en Contrat
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client & Notes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 border-white/5 space-y-4">
            <h3 className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-2 border-b border-white/5 pb-2">Client Destinataire</h3>
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Building2 className="w-5 h-5 text-[var(--color-turbo)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{devis.client_nom || "Client inconnu"}</p>
                {devis.contrat_id && (
                  <p className="text-[10px] font-accent uppercase tracking-widest text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Contrat Lié
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border-white/5 space-y-4">
            <h3 className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-2 border-b border-white/5 pb-2">Objet & Conditions</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Objet de la prestation</span>
                <p className="text-sm font-bold text-white mt-1">{devis.objet}</p>
              </div>
            </div>
            {devis.conditions_reglement && (
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-2">Conditions de règlement</h4>
                <p className="text-xs text-white/70 bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {devis.conditions_reglement}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lignes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-0 border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-black/20">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-[var(--color-turbo)]" /> Prestations Proposées
              </h3>
            </div>
            <div className="min-w-0 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/20 border-b border-white/5 text-white/40 font-accent uppercase tracking-widest text-[9px]">
                  <tr>
                    <th className="py-3 px-5 w-10">#</th>
                    <th className="py-3 px-5">Service / Description</th>
                    <th className="py-3 px-5 text-center">Qté</th>
                    <th className="py-3 px-5 text-right">Prix Unitaire</th>
                    <th className="py-3 px-5 text-right">Total Ligne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {devis.lignes?.map((ligne, idx) => (
                    <tr key={ligne.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5 text-white/30 font-mono">{idx + 1}</td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-white mb-0.5">{ligne.service}</div>
                        <div className="text-white/50 text-[10px] leading-tight max-w-[250px]">{ligne.description}</div>
                      </td>
                      <td className="py-4 px-5 text-center font-mono text-white/80">{ligne.quantite}</td>
                      <td className="py-4 px-5 text-right font-mono text-white/80">
                        {ligne.prix_unitaire.toLocaleString("fr-FR")} <span className="text-[9px] font-sans text-white/30">DZD</span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-white">
                        {ligne.total_ligne.toLocaleString("fr-FR")} <span className="text-[9px] font-sans text-white/30">DZD</span>
                      </td>
                    </tr>
                  ))}
                  {(!devis.lignes || devis.lignes.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/40">Aucune ligne enregistrée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Box */}
            <div className="bg-[#0B0514]/40 p-6 border-t border-white/5 flex flex-col items-end space-y-2 text-sm">
              <div className="flex justify-between w-full max-w-[250px]">
                <span className="text-white/50">Total HT</span>
                <span className="font-mono text-white">{devis.total_ht.toLocaleString("fr-FR")} <span className="text-[10px] font-sans text-white/30">DZD</span></span>
              </div>
              <div className="flex justify-between w-full max-w-[250px]">
                <span className="text-white/50">TVA ({devis.taux_tva}%)</span>
                <span className="font-mono text-white">{devis.montant_tva.toLocaleString("fr-FR")} <span className="text-[10px] font-sans text-white/30">DZD</span></span>
              </div>
              <div className="h-px bg-white/10 w-full max-w-[250px] my-1" />
              <div className="flex justify-between w-full max-w-[250px] text-lg">
                <span className="font-accent uppercase tracking-widest text-[10px] text-[var(--color-turbo)] font-bold self-end pb-1">Total TTC</span>
                <span className="font-heading font-bold text-white">{devis.total_ttc.toLocaleString("fr-FR")} <span className="text-xs font-sans text-white/40">DZD</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GlassConfirmModal
        isOpen={confirmModal.isOpen}
        title="Conversion en Contrat"
        message="Voulez-vous convertir ce devis en contrat d'exploitation actif ? Cette action créera automatiquement un contrat associé à ce client."
        confirmText="Convertir"
        cancelText="Annuler"
        type="info"
        onConfirm={executeConvertDevis}
        onCancel={() => setConfirmModal({ isOpen: false, isLoading: false })}
        isLoading={confirmModal.isLoading}
      />

      {/* Global File Upload */}
      <div className="mt-8">
        <GlassDocumentManager
          entityType="devis"
          entityId={devis.id}
          title="Fichiers Attachés"
          subtitle="Ajoutez des documents annexes, cahier des charges, ou notes"
        />
      </div>
    </div>
  );
}
