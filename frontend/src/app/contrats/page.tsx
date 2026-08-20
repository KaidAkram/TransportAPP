"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Archive,
  ArchiveRestore,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Factory,
} from "lucide-react";
import { AddContractModal } from "@/components/modules/contrats/AddContractModal";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { api } from "@/lib/api";
import { Contrat, ContratListResponse } from "@/types/contrat";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";

export default function ContratsPage() {
  const [contracts, setContracts] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    type: "danger" | "success" | "warning" | "info";
    confirmText: string;
    onConfirm: () => void;
  }>({ title: "", message: "", type: "warning", confirmText: "Confirmer", onConfirm: () => {} });

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.page = page.toString();
      if (statusFilter) params.statut = statusFilter;
      if (typeFilter) params.type_contrat = typeFilter;
      if (showArchived) params.include_archived = "true";

      const res = await api.get<ContratListResponse>("/contrats", params);
      setContracts(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page, showArchived]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, showArchived]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const openConfirm = (cfg: typeof confirmConfig) => {
    setConfirmConfig(cfg);
    setConfirmOpen(true);
  };

  const handleArchive = async (id: string, ref: string) => {
    openConfirm({
      title: "Archiver le contrat",
      message: `Archiver le contrat ${ref} ? Il n'apparaîtra plus dans la liste principale mais restera dans la base de données.`,
      type: "warning",
      confirmText: "Archiver",
      onConfirm: async () => {
        try {
          await api.post(`/contrats/${id}/archive`, {});
          fetchContracts();
        } catch (err) {
          alert("Erreur lors de l'archivage du contrat.");
        }
      },
    });
  };

  const handleUnarchive = async (id: string, ref: string) => {
    openConfirm({
      title: "Restaurer le contrat",
      message: `Restaurer le contrat ${ref} ? Il réapparaîtra dans la liste principale.`,
      type: "success",
      confirmText: "Restaurer",
      onConfirm: async () => {
        try {
          await api.post(`/contrats/${id}/unarchive`, {});
          fetchContracts();
        } catch (err) {
          alert("Erreur lors de la restauration du contrat.");
        }
      },
    });
  };

  // KPI Calculations
  const totalCount = contracts.length;
  const actifsCount = contracts.filter((c) => c.statut === "ACTIF").length;
  const expirantBientotCount = contracts.filter(
    (c) => c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants >= 0 && c.jours_restants <= 30
  ).length;
  const totalVolumeDZD = contracts.reduce((acc, c) => acc + (c.montant || 0), 0);

  return (
    <>
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <FileText className="w-3 h-3" />
            Suivi Contractuel
          </p>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
            Gestion des Contrats & Conventions
          </h1>
          <p className="text-sm text-white/60 mt-1 font-sans max-w-xl">
            {showArchived ? "Contrats archivés — vous pouvez les restaurer" : "Suivi des accords commerciaux, avenants d'extension et alertes d'échéances"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${
              showArchived
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            }`}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Archives" : "Archives"}
          </button>
          <button
            onClick={fetchContracts}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group"
          >
            <RefreshCw className={`h-4 w-4 text-[var(--color-electric-violet)] transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
            Actualiser
          </button>
          {!showArchived && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-electric-violet)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6c3ce0] transition-colors shadow-[0_0_15px_rgba(131,77,251,0.4)] hover:shadow-[0_0_25px_rgba(131,77,251,0.6)]"
            >
              <Plus className="h-4 w-4" />
              Nouveau Contrat
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards - only when not viewing archives */}
      {!showArchived && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
          <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
            <div>
              <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Total Contrats</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-extrabold text-white">{totalCount}</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">Conventions enregistrées</p>
            </div>
            <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
              <FileText className="h-5 w-5 text-white/80 group-hover:text-white" />
            </div>
          </div>

          <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
            <div>
              <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Contrats Actifs</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{actifsCount}</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">En cours de validité</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
            <div>
              <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Échéances Proches</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-extrabold text-[var(--color-turbo)] drop-shadow-[0_0_10px_rgba(240,225,0,0.3)]">{expirantBientotCount}</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">Expirant dans &lt; 30 jours</p>
            </div>
            <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:border-[var(--color-turbo)]/40 transition-colors">
              <AlertTriangle className="h-5 w-5 text-[var(--color-turbo)]" />
            </div>
          </div>

          <div className="glass-panel px-6 py-5 hover:bg-white/[0.02] transition-colors group overflow-hidden">
            <div>
              <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Volume Financier (Actif)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-[var(--color-electric-violet)] whitespace-nowrap">{totalVolumeDZD.toLocaleString("fr-FR")}</span>
                <span className="text-[10px] font-bold text-white/40 shrink-0">DZD</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">Valeur totale cumulée</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="relative z-20 flex flex-col sm:flex-row justify-between gap-3 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une référence, un partenaire, un objet..."
            className="w-full !pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[var(--color-haiti)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {!showArchived && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-all cursor-pointer appearance-none font-medium"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff40%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="" className="bg-[var(--color-haiti)] text-white">Tous les statuts</option>
                <option value="ACTIF" className="bg-[var(--color-haiti)] text-white">Contrats Actifs</option>
                <option value="EXPIRE" className="bg-[var(--color-haiti)] text-white">Contrats Expirés</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-all cursor-pointer appearance-none font-medium"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff40%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="" className="bg-[var(--color-haiti)] text-white">Tous les types de contrat</option>
                <option value="Transport" className="bg-[var(--color-haiti)] text-white">Transport Régulier / Navettes</option>
                <option value="Tourisme" className="bg-[var(--color-haiti)] text-white">Circuits Touristiques</option>
                <option value="Location" className="bg-[var(--color-haiti)] text-white">Location d'Autocars</option>
                <option value="Fourniture" className="bg-[var(--color-haiti)] text-white">Fourniture de Pièces</option>
                <option value="Maintenance" className="bg-[var(--color-haiti)] text-white">Prestations de Maintenance</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-2xl overflow-hidden p-0 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
        {showArchived && (
          <div className="px-5 py-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2">
            <Archive className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Mode Archive</span>
            <span className="text-xs text-white/50">— Contrats archivés, cliquez restaurer pour réactiver</span>
          </div>
        )}
        <div className="w-full min-w-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Réf. Contrat</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Partenaire</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Type & Objet</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Montant</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Période</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Statut / Échéance</th>
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
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      title={showArchived ? "Aucun contrat archivé" : "Aucun contrat"}
                      message={showArchived ? "Aucun contrat n'a été archivé." : "Aucun contrat ou convention ne correspond à vos critères de recherche."}
                      icon={showArchived ? Archive : FileText}
                    />
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const isClient = c.partenaire_role === "CLIENT";
                  const isArchived = !!c.archived_at;
                  const isUrgent = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants >= 0 && c.jours_restants <= 7;
                  const isWarning = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants > 7 && c.jours_restants <= 30;
                  const isExpired = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants < 0;

                  return (
                    <tr
                      key={c.id}
                      className={`group hover:bg-white/[0.02] transition-colors ${isArchived ? "opacity-60" : ""}`}
                    >
                      <td className="py-4 px-5">
                        <Link
                          href={`/contrats/${c.id}`}
                          className="font-mono text-[13px] font-bold text-[var(--color-electric-violet)] hover:text-[#9D75FF] transition-colors"
                        >
                          {c.reference}
                        </Link>
                        {isArchived && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-amber-400/70 uppercase">
                            <Archive className="h-2.5 w-2.5" /> archivé
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-white mb-0.5">{c.partenaire_nom || "Entreprise"}</span>
                          <span className={`inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[9px] font-accent uppercase tracking-widest font-bold ${
                            isClient ? "bg-white/10 text-white" : "bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)]"
                          }`}>
                            {isClient ? <Users className="h-2.5 w-2.5" /> : <Factory className="h-2.5 w-2.5" />}
                            {isClient ? "Client" : "Fournisseur"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-[13px] font-medium text-white truncate max-w-[200px]" title={c.objet}>
                          {c.objet}
                        </p>
                        <p className="text-[11px] text-white/50">{c.type_contrat}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-mono text-[13px] font-bold text-white">
                          {c.montant.toLocaleString("fr-DZ")} {c.devise}
                        </div>
                        {c.mode_facturation && (
                          <p className="text-[10px] text-white/50">{c.mode_facturation}</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-[11px] text-white/70 font-mono flex flex-col gap-0.5">
                          <span>{new Date(c.date_debut).toLocaleDateString("fr-FR")}</span>
                          <span className="text-white/30">&darr;</span>
                          <span>{new Date(c.date_fin).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.statut === "ACTIF"
                              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                              : "bg-white/5 text-white/50 border border-white/10"
                          }`}>
                            {c.statut}
                          </span>

                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400">
                              <AlertTriangle className="h-3 w-3" /> Expiré
                            </span>
                          ) : isUrgent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 animate-pulse">
                              <Clock className="h-3 w-3" /> {c.alerte_expiration}
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-turbo)]">
                              <Clock className="h-3 w-3" /> {c.alerte_expiration}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/50">
                              Valide ({c.jours_restants} j)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/contrats/${c.id}`}>
                            <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-[11px] font-bold text-white transition-all">
                              <Eye className="w-3.5 h-3.5" />
                              DOSSIER
                            </button>
                          </Link>
                          {isArchived ? (
                            <button
                              onClick={() => handleUnarchive(c.id, c.reference)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                              title="Restaurer"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              RESTAURER
                            </button>
                          ) : isExpired ? (
                            <button
                              onClick={() => handleArchive(c.id, c.reference)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                              title="Archiver ce contrat expiré"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              ARCHIVER
                            </button>
                          ) : null}
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

      <AddContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchContracts()}
      />
    </div>

    <GlassConfirmModal
      isOpen={confirmOpen}
      title={confirmConfig.title}
      message={confirmConfig.message}
      type={confirmConfig.type}
      confirmText={confirmConfig.confirmText}
      onConfirm={() => {
        confirmConfig.onConfirm();
        setConfirmOpen(false);
      }}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  );
}
