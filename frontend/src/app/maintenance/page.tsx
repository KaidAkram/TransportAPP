"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Bus,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { AddInterventionModal } from "@/components/modules/maintenance/AddInterventionModal";
import { AddInterventionDocumentModal } from "@/components/modules/maintenance/AddInterventionDocumentModal";
import { ViewInterventionModal } from "@/components/modules/maintenance/ViewInterventionModal";
import { api } from "@/lib/api";
import { Intervention, InterventionListResponse } from "@/types/intervention";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Portal } from "@/components/shared/Portal";
import { SortableHeader } from "@/components/ui/SortableHeader";

export default function MaintenancePage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docModal, setDocModal] = useState<{
    isOpen: boolean;
    interventionId: string;
  }>({ isOpen: false, interventionId: "" });
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; interventionId: string | null }>({ isOpen: false, interventionId: null });
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else { setSortBy(undefined); setSortOrder("asc"); }
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Glass Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    interventionId: string | null;
    interventionNum: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    interventionId: null,
    interventionNum: "",
    isLoading: false,
  });

  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.page = page.toString();
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.statut = statusFilter;
      if (yearFilter) params.annee = yearFilter;
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }

      const res = await api.get<InterventionListResponse>("/interventions", params);
      setInterventions(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching interventions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, yearFilter, page, sortBy, sortOrder]);

  
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, yearFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  const handleDeleteClick = (id: string, num: string) => {
    setConfirmModal({ isOpen: true, interventionId: id, interventionNum: num, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.interventionId) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/interventions/${confirmModal.interventionId}`);
      fetchInterventions();
    } catch (err) {
      console.error("Erreur lors de l'annulation de l'intervention:", err);
    } finally {
      setConfirmModal({ isOpen: false, interventionId: null, interventionNum: "", isLoading: false });
    }
  };

  // KPI calculations
  const totalCount = interventions.length;
  const termineesCount = interventions.filter((i) => i.statut === "TERMINEE").length;
  const enCoursCount = interventions.filter((i) => i.statut === "EN_COURS").length;
  const totalCoutDZD = interventions.reduce((acc, i) => acc + (i.cout_total || 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <Wrench className="w-3 h-3" />
            Maintenance & GMAO
          </p>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
            Gestion des Ordres de Travail
          </h1>
          <p className="text-sm text-white/60 mt-1 font-sans max-w-xl">
            Suivi des révisions, réparations et traçabilité des pièces consommées
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInterventions}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group"
          >
            <RefreshCw className={`h-4 w-4 text-[var(--color-electric-violet)] transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
            Actualiser
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-electric-violet)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6c3ce0] transition-colors shadow-[0_0_15px_rgba(131,77,251,0.4)] hover:shadow-[0_0_25px_rgba(131,77,251,0.6)]"
          >
            <Plus className="h-4 w-4" />
            Nouvel Ordre de Travail
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Total Interventions</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{totalCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Ordres de travail émis</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <Wrench className="h-5 w-5 text-white/80 group-hover:text-white" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Travaux Terminés</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{termineesCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Remis en circulation</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/40 group-hover:border-emerald-500/60 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">En Cours Atelier</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-turbo)] drop-shadow-[0_0_10px_rgba(240,225,0,0.3)]">{enCoursCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Véhicules immobilisés</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:border-[var(--color-turbo)]/40 transition-colors">
            <Clock className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 hover:bg-white/[0.02] transition-colors group overflow-hidden">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Budget Dépensé</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-[var(--color-electric-violet)] whitespace-nowrap">{totalCoutDZD.toLocaleString("fr-FR")}</span>
              <span className="text-[10px] font-bold text-white/40 shrink-0">DZD</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Coût global des réparations</p>
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
            placeholder="Rechercher par n° OT, immatriculation, catégorie..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[var(--color-haiti)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] font-medium"
          />
        </div>
        
        <div className="w-full sm:w-[250px]">
          <GlassSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "", label: "Tous les types d'intervention" },
              { value: "PREVENTIVE", label: "Maintenance Préventive" },
              { value: "CORRECTIVE", label: "Maintenance Corrective" },
            ]}
          />
        </div>

        <div className="w-full sm:w-[200px]">
          <GlassSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Tous les statuts" },
              { value: "PLANIFIEE", label: "Planifiée" },
              { value: "EN_COURS", label: "En Cours" },
              { value: "TERMINEE", label: "Terminée" },
              { value: "ANNULEE", label: "Annulée" },
            ]}
          />
        </div>

        <div className="w-full sm:w-[150px]">
          <GlassSelect
            value={yearFilter}
            onChange={setYearFilter}
            options={[
              { value: "", label: "Toutes les années" },
              ...Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: year.toString(), label: year.toString() };
              }),
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden p-0 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
        <div className="w-full min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <SortableHeader label="N° Ordre de Travail" field="numero" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Véhicule" field="vehicule_immatriculation" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Type & Catégorie" field="type" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Responsable" field="mecanicien_responsable_nom" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Date & Info" field="date" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Coût Total" field="cout_total" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Statut" field="statut" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton rows={6} />
                  </td>
                </tr>
              ) : interventions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState 
                      title="Aucune intervention" 
                      message="Aucun ordre de travail enregistré ne correspond à votre recherche." 
                      icon={Wrench} 
                    />
                  </td>
                </tr>
              ) : (
                interventions.map((i) => {
                  const isPreventive = i.type === "PREVENTIVE";

                  return (
                    <tr
                      key={i.id}
                      className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setViewModal({ isOpen: true, interventionId: i.id })}
                    >
                      <td className="py-4 px-5">
                        <span className="font-mono text-[11px] font-bold text-[var(--color-electric-violet)] block">
                          {i.numero}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-white/50" />
                          <div>
                            <p className="text-xs font-bold text-white font-mono">
                              {i.vehicule_immatriculation || "Véhicule"}
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5 truncate max-w-[120px]">
                              {i.vehicule_modele || "Modèle inconnu"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 max-w-[150px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 border ${
                            isPreventive
                              ? "bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border-[var(--color-electric-violet)]/20"
                              : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          }`}
                        >
                          {isPreventive ? "Préventive" : "Corrective"}
                        </span>
                        <p className="text-[11px] text-white/80 font-bold truncate" title={i.categorie}>
                          {i.categorie}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        {i.mecanicien_nom_complet ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-white/50" />
                            <p className="text-xs text-white/80">{i.mecanicien_nom_complet}</p>
                          </div>
                        ) : (
                          <span className="text-white/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-xs text-white/80 font-mono">
                          {new Date(i.date).toLocaleDateString("fr-FR")}
                        </div>
                        {i.kilometrage && (
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">
                            {i.kilometrage.toLocaleString("fr-FR")} KM
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs font-bold text-white block">
                          {(i.cout_total || 0).toLocaleString("fr-DZ")} DZD
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            i.statut === "EN_COURS"
                              ? "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                              : i.statut === "TERMINEE"
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              : i.statut === "ANNULEE"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-white/5 text-white/50 border-white/10"
                          }`}
                        >
                          {i.statut}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDocModal({ isOpen: true, interventionId: i.id })}
                            className="p-1.5 rounded-xl border border-[var(--color-turbo)]/20 bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] hover:bg-[var(--color-turbo)]/20 transition-colors shadow-sm"
                            title="Ajouter un document"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(i.id, i.numero)}
                            className="p-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shadow-sm"
                            title="Annuler/Supprimer l'ordre de travail"
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
      {/* Add Modal */}
      <AddInterventionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchInterventions()}
      />
      
      {/* Upload Document Modal */}
      {docModal.isOpen && (
        <AddInterventionDocumentModal
          interventionId={docModal.interventionId}
          isOpen={docModal.isOpen}
          onClose={() => setDocModal({ isOpen: false, interventionId: "" })}
          onSuccess={() => {
            // Document ajouté avec succès
          }}
        />
      )}

      {/* View Intervention Details Modal */}
      <ViewInterventionModal
        interventionId={viewModal.interventionId}
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, interventionId: null })}
      />

      {/* Confirm Archiving Modal */}
      <GlassConfirmModal
        isOpen={confirmModal.isOpen}
        onCancel={() => setConfirmModal({ isOpen: false, interventionId: null, interventionNum: "", isLoading: false })}
        onConfirm={handleDeleteConfirm}
        title="Annuler l'Ordre de Travail"
        message={`Êtes-vous sûr de vouloir annuler et archiver l'ordre de travail ${confirmModal.interventionNum} ?`}
        confirmText="Confirmer l'annulation"
        cancelText="Retour"
        isLoading={confirmModal.isLoading}
        type="danger"
      />
      </Portal>
    </div>
  );
}

