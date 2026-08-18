"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  Search,
  RefreshCw,
  Download,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { AddCautionModal } from "@/components/modules/cautions/AddCautionModal";
import { NouvelleDemandeModal } from "@/components/modules/cautions/NouvelleDemandeModal";
import { api } from "@/lib/api";
import { Caution, CautionListResponse } from "@/types/caution";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Portal } from "@/components/shared/Portal";

export default function CautionsPage() {
  const [cautions, setCautions] = useState<Caution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDemandeModalOpen, setIsDemandeModalOpen] = useState(false);

  // Glass Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    cautionId: string | null;
    cautionNum: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    cautionId: null,
    cautionNum: "",
    isLoading: false,
  });

  const fetchCautions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.page = page.toString();
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.statut = statusFilter;

      const res = await api.get<CautionListResponse>("/cautions", params);
      setCautions(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching cautions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page]);

  
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchCautions();
  }, [fetchCautions]);

  const handleGeneratePdf = async (id: string) => {
    try {
      await api.post(`/cautions/${id}/generate-pdf`, {});
      fetchCautions();
    } catch (err) {
      alert("Erreur lors de la génération du document PDF de la caution.");
    }
  };

  const handleDeleteClick = (id: string, num: string) => {
    setConfirmModal({ isOpen: true, cautionId: id, cautionNum: num, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.cautionId) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/cautions/${confirmModal.cautionId}`);
      fetchCautions();
    } catch (err) {
      console.error("Erreur lors de l'archivage de la caution:", err);
    } finally {
      setConfirmModal({ isOpen: false, cautionId: null, cautionNum: "", isLoading: false });
    }
  };

  // KPI Calculations
  const totalCount = cautions.length;
  const chezClientCount = cautions.filter((c) => c.statut === "CHEZ_CLIENT").length;
  const retourneeCount = cautions.filter((c) => c.statut === "RETOURNEE" || c.statut === "MAIN_LEVEE").length;
  const totalGarantiDZD = cautions.reduce((acc, c) => acc + (c.montant || 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            Engagements Financiers
          </p>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
            Gestion des Cautions Bancaires
          </h1>
          <p className="text-sm text-white/60 mt-1 font-sans max-w-xl">
            Suivi des garanties (Soumission & Bonne Exécution) et génération d'actes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCautions}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group"
          >
            <RefreshCw className={`h-4 w-4 text-[var(--color-electric-violet)] transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
            Actualiser
          </button>
          <button
            onClick={() => setIsDemandeModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-bold text-white border border-white/10 hover:bg-white/10 transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Nouvelle Demande
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-electric-violet)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6c3ce0] transition-colors shadow-[0_0_15px_rgba(131,77,251,0.4)] hover:shadow-[0_0_25px_rgba(131,77,251,0.6)]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Caution
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Total Cautions</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{totalCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Actes de garantie émis</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <ShieldCheck className="h-5 w-5 text-white/80 group-hover:text-white" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Chez le Client</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-turbo)] drop-shadow-[0_0_10px_rgba(240,225,0,0.3)]">{chezClientCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">En cours de rétention</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:border-[var(--color-turbo)]/40 transition-colors">
            <Clock className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Retournées</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{retourneeCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Fonds libérés / Mainlevée</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 hover:bg-white/[0.02] transition-colors group overflow-hidden">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Encours Cautionné</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-[var(--color-electric-violet)] whitespace-nowrap">{totalGarantiDZD.toLocaleString("fr-FR")}</span>
              <span className="text-[10px] font-bold text-white/40 shrink-0">DZD</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Garanties globales</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-20 flex flex-col sm:flex-row gap-3 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40 group-focus-within:text-[var(--color-electric-violet)] transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° caution, client, contrat..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[var(--color-haiti)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] font-medium"
          />
        </div>
        
        <div className="w-full sm:w-[220px]">
          <GlassSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "", label: "Tous les types de caution" },
              { value: "BONNE_EXECUTION", label: "Bonne Exécution" },
              { value: "SOUMISSION", label: "Soumission (AO)" },
              { value: "DEMANDE", label: "Demande" },
            ]}
          />
        </div>

        <div className="w-full sm:w-[200px]">
          <GlassSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Tous les statuts" },
              { value: "CHEZ_CLIENT", label: "Chez le Client" },
              { value: "CREATION", label: "En Création" },
              { value: "RETOURNEE", label: "Retournée" },
              { value: "MAIN_LEVEE", label: "Mainlevée Accordée" },
            ]}
          />
        </div>
      </div>

      {/* Cautions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden p-0 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
        <div className="w-full min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">N° Caution</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Client / Bénéficiaire</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Type & Objet</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Montant Garanti</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Émission / Échéance</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Statut</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : cautions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState 
                      title="Aucune caution" 
                      message="Aucune caution enregistrée ne correspond à vos filtres." 
                      icon={ShieldCheck} 
                    />
                  </td>
                </tr>
              ) : (
                cautions.map((c) => {
                  const isBonneExec = c.type === "BONNE_EXECUTION";
                  const isDemande = c.type === "DEMANDE";

                  return (
                    <tr
                      key={c.id}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-5">
                        <Link href={`/cautions/${c.id}`}>
                          <span className="font-mono text-[11px] font-bold text-[var(--color-electric-violet)] block mb-0.5 hover:underline cursor-pointer">
                            {c.numero}
                          </span>
                        </Link>
                        <span className="text-[10px] text-white/40 font-mono">
                          {c.banque_emetteur}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-xs font-bold text-white">
                          {c.client_nom || "Client"}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 font-mono">
                          Réf: {c.contrat_reference || c.reference_numero || "—"}
                        </p>
                      </td>
                      <td className="py-4 px-5 max-w-[200px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 border ${
                            isDemande
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              : isBonneExec
                              ? "bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border-[var(--color-electric-violet)]/20"
                              : "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                          }`}
                        >
                          {isDemande ? "Demande" : isBonneExec ? "Bonne Exécution" : "Soumission"}
                        </span>
                        <p className="text-xs text-white/60 truncate" title={c.objet}>
                          {c.objet}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs font-bold text-white block">
                          {c.montant.toLocaleString("fr-DZ")} {c.devise}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-xs text-white/80 font-mono">
                          {new Date(c.date_emission).toLocaleDateString("fr-FR")}
                        </div>
                        {c.date_echeance && (
                          <div className="text-[10px] text-[var(--color-turbo)] font-mono mt-0.5">
                            Échéance: {new Date(c.date_echeance).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            c.statut === "CHEZ_CLIENT"
                              ? "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                              : c.statut === "RETOURNEE" || c.statut === "MAIN_LEVEE"
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              : "bg-white/5 text-white/50 border-white/10"
                          }`}
                        >
                          {c.statut === "CHEZ_CLIENT"
                            ? "Chez le Client"
                            : c.statut === "RETOURNEE"
                            ? "Retournée"
                            : c.statut === "MAIN_LEVEE"
                            ? "Mainlevée"
                            : "Création"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {c.url_caution_pdf ? (
                            <a
                              href={c.url_caution_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white font-medium hover:bg-white/10 transition-colors shadow-sm"
                            >
                              <Download className="h-3.5 w-3.5" /> PDF
                            </a>
                          ) : (
                            <button
                              onClick={() => handleGeneratePdf(c.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-electric-violet)]/30 bg-[var(--color-electric-violet)]/10 px-3 py-1.5 text-xs text-[var(--color-electric-violet)] font-medium hover:bg-[var(--color-electric-violet)]/20 transition-colors shadow-sm"
                            >
                              <FileText className="h-3 w-3" /> Générer
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(c.id, c.numero)}
                            className="p-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shadow-sm"
                            title="Archiver la caution"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <GlassPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </div>

            {/* Modals */}
      <Portal>
{/* Add Caution Modal */}
      <AddCautionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCautions()}
      />

      {/* Nouvelle Demande Modal */}
      <NouvelleDemandeModal
        isOpen={isDemandeModalOpen}
        onClose={() => setIsDemandeModalOpen(false)}
        onSuccess={() => fetchCautions()}
      />

      {/* Confirm Archiving Modal */}
      <GlassConfirmModal
        isOpen={confirmModal.isOpen}
        onCancel={() => setConfirmModal({ isOpen: false, cautionId: null, cautionNum: "", isLoading: false })}
        onConfirm={handleDeleteConfirm}
        title="Archiver la caution"
        message={`Êtes-vous sûr de vouloir archiver la caution ${confirmModal.cautionNum} ? Cette action la masquera des listes actives.`}
        confirmText="Archiver"
        cancelText="Annuler"
        isLoading={confirmModal.isLoading}
        type="danger"
      />
      </Portal>
    </div>
  );
}

