"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wrench, Bus, UserCheck, Calendar, DollarSign, Package, FileText, AlertTriangle, Download, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { InterventionDetail } from "@/types/intervention";

interface ViewInterventionModalProps {
  interventionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewInterventionModal({ interventionId, isOpen, onClose }: ViewInterventionModalProps) {
  const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && interventionId) {
      setLoading(true);
      api.get<InterventionDetail>(`/interventions/${interventionId}`)
        .then((res) => setIntervention(res.data))
        .catch((err) => console.error("Error fetching intervention:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, interventionId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-4xl rounded-2xl bg-[var(--color-haiti)] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--color-electric-violet)]/20 flex items-center justify-center border border-[var(--color-electric-violet)]/30 shadow-[0_0_15px_rgba(131,77,251,0.2)]">
                  <Wrench className="h-5 w-5 text-[var(--color-electric-violet)]" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-white flex items-center gap-2">
                    Détails de l&apos;Ordre de Travail
                  </h2>
                  <p className="text-xs font-mono text-white/50">{intervention?.numero || "Chargement..."}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-electric-violet)]"></div>
                </div>
              ) : intervention ? (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    intervention.statut === "TERMINEE" ? "bg-emerald-500/10 border-emerald-500/20" :
                    intervention.statut === "EN_COURS" ? "bg-[var(--color-turbo)]/10 border-[var(--color-turbo)]/20" :
                    intervention.statut === "ANNULEE" ? "bg-red-500/10 border-red-500/20" :
                    "bg-white/5 border-white/10"
                  }`}>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider mb-1">Statut actuel</p>
                      <span className={`text-sm font-bold uppercase tracking-widest ${
                        intervention.statut === "TERMINEE" ? "text-emerald-400" :
                        intervention.statut === "EN_COURS" ? "text-[var(--color-turbo)]" :
                        intervention.statut === "ANNULEE" ? "text-red-400" :
                        "text-white/80"
                      }`}>{intervention.statut}</span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-[var(--color-electric-violet)]/70 tracking-wider mb-1">Coût Total</p>
                      <p className="text-xl font-mono font-bold text-[var(--color-electric-violet)]">
                        {(intervention.cout_total || 0).toLocaleString("fr-DZ")} DZD
                      </p>
                    </div>
                  </div>

                  {/* Grid Infos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Info Véhicule */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                        <Bus className="h-4 w-4 text-white/50" />
                        <h3 className="text-sm font-bold text-white">Informations Véhicule</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Immatriculation</span>
                          <span className="text-xs font-mono font-bold text-white">{intervention.vehicule_immatriculation || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Modèle</span>
                          <span className="text-xs font-bold text-white">{intervention.vehicule_modele || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Kilométrage</span>
                          <span className="text-xs font-mono font-bold text-white">{(intervention.kilometrage || 0).toLocaleString("fr-FR")} KM</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Maintenance */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                        <Calendar className="h-4 w-4 text-white/50" />
                        <h3 className="text-sm font-bold text-white">Détails Maintenance</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Type</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            intervention.type === "PREVENTIVE" ? "bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border-[var(--color-electric-violet)]/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          }`}>{intervention.type === "PREVENTIVE" ? "Préventive" : "Corrective"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Catégorie</span>
                          <span className="text-xs font-bold text-white">{intervention.categorie}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Date</span>
                          <span className="text-xs font-mono font-bold text-white">{new Date(intervention.date).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Responsable</span>
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3 w-3 text-white/50" />
                            <span className="text-xs font-bold text-white">{intervention.mecanicien_nom_complet || "Non assigné"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Travaux & Diagnostic */}
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[var(--color-turbo)]" />
                        Diagnostic & Travaux Effectués
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Problème / Diagnostic</p>
                        <div className="bg-black/20 rounded-lg p-3 text-sm text-white/80 min-h-[60px] border border-white/5">
                          {intervention.probleme_constate || intervention.diagnostic || (
                            <span className="italic text-white/30">Aucun détail fourni.</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--color-turbo)]/70 mb-2 font-bold">Travail Effectué</p>
                        <div className="bg-[var(--color-turbo)]/5 rounded-lg p-3 text-sm text-white/90 min-h-[60px] border border-[var(--color-turbo)]/10">
                          {intervention.travail_effectue || (
                            <span className="italic text-white/30">Aucun travail décrit.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pièces Consommées */}
                  {intervention.pieces_consommees && intervention.pieces_consommees.length > 0 && (
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-400" />
                          Pièces Consommées ({intervention.total_pieces_utilisees})
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {intervention.pieces_consommees.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                              <div>
                                <p className="text-xs font-bold text-white">{p.designation}</p>
                                <p className="text-[10px] font-mono text-white/50">{p.reference}</p>
                              </div>
                              <span className="font-mono text-sm font-extrabold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md">
                                x{p.quantite}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {intervention.documents && intervention.documents.length > 0 && (
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          Documents Attachés
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {intervention.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.url_fichier}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{doc.nom}</p>
                                <p className="text-[10px] text-white/40 uppercase">{doc.type}</p>
                              </div>
                              <Download className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-white/40 text-sm">
                  Impossible de charger les détails de l&apos;intervention.
                </div>
              )}
            </div>
            
            {/* Minimal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
