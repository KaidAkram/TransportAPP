"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  ArrowDownRight,
  ClipboardCheck,
  Trash2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { AddPieceModal } from "@/components/modules/stock/AddPieceModal";
import { AddStockEntryModal } from "@/components/modules/stock/AddStockEntryModal";
import { InventoryAuditModal } from "@/components/modules/stock/InventoryAuditModal";
import { api } from "@/lib/api";
import { Piece, PieceListResponse } from "@/types/stock";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Portal } from "@/components/shared/Portal";

export default function StockPage() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [kpiData, setKpiData] = useState({
    total_references: 0,
    total_stock_normal: 0,
    total_stock_faible: 0,
    total_rupture: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    pieceId: string | null;
    pieceRef: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    pieceId: null,
    pieceRef: "",
    isLoading: false,
  });

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.page = page.toString();
      if (categoryFilter) params.categorie = categoryFilter;
      if (statusFilter) params.statut_stock = statusFilter;

      const res = await api.get<PieceListResponse>("/stock/pieces", params);
      setPieces(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
      setKpiData({
        total_references: res.data.total_references,
        total_stock_normal: res.data.total_stock_normal,
        total_stock_faible: res.data.total_stock_faible,
        total_rupture: res.data.total_rupture,
      });
    } catch (err) {
      console.error("Error fetching stock:", err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, page]);

  
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleOpenEntry = (piece?: Piece) => {
    setSelectedPiece(piece || null);
    setIsEntryModalOpen(true);
  };

  const handleOpenAudit = (piece: Piece) => {
    setSelectedPiece(piece);
    setIsAuditModalOpen(true);
  };

  const handleDeleteClick = (id: string, ref: string) => {
    setConfirmModal({ isOpen: true, pieceId: id, pieceRef: ref, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.pieceId) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/stock/pieces/${confirmModal.pieceId}`);
      fetchStock();
    } catch (err) {
      console.error("Erreur lors de l'archivage de la pièce:", err);
    } finally {
      setConfirmModal({ isOpen: false, pieceId: null, pieceRef: "", isLoading: false });
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <Package className="w-3 h-3" />
            Stock & Magasin
          </p>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
            Gestion du Stock & Pièces
          </h1>
          <p className="text-sm text-white/60 mt-1 font-sans max-w-xl">
            Inventaire magasin, réceptions fournisseurs et déductions automatiques atelier
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStock}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group"
          >
            <RefreshCw className={`h-4 w-4 text-[var(--color-electric-violet)] transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
            Actualiser
          </button>
          <Link
            href="/stock/receptions"
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
          >
            <History className="h-4 w-4 text-[var(--color-electric-violet)]" />
            Historique
          </Link>
          <button
            onClick={() => handleOpenEntry()}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/30"
          >
            <ArrowDownRight className="h-4 w-4" />
            Réception
          </button>
          <button
            onClick={() => setIsAddPieceModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-electric-violet)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6c3ce0] transition-colors shadow-[0_0_15px_rgba(131,77,251,0.4)] hover:shadow-[0_0_25px_rgba(131,77,251,0.6)]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Pièce
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Total Références</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpiData.total_references}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Articles au catalogue magasin</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <Package className="h-5 w-5 text-white/80 group-hover:text-white" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Stock Normal</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{kpiData.total_stock_normal}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Niveau de stock optimal</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/40 group-hover:border-emerald-500/60 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Stock Faible (&le; Min)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-turbo)] drop-shadow-[0_0_10px_rgba(240,225,0,0.3)]">{kpiData.total_stock_faible}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">À commander rapidement</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:border-[var(--color-turbo)]/40 transition-colors">
            <AlertTriangle className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Rupture de Stock</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">{kpiData.total_rupture}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Stock épuisé (0 dispo)</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 group-hover:border-red-500/40 transition-colors">
            <Package className="h-5 w-5 text-red-500" />
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
            placeholder="Rechercher par réf, désignation, marque, emplacement..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[var(--color-haiti)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] font-medium"
          />
        </div>
        
        <div className="w-full sm:w-[250px]">
          <GlassSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "", label: "Toutes les catégories" },
              { value: "Filtres", label: "Filtres" },
              { value: "Freinage", label: "Freinage" },
              { value: "Moteur", label: "Moteur & Courroies" },
              { value: "Lubrifiants", label: "Huiles & Lubrifiants" },
              { value: "Carrosserie", label: "Carrosserie & Vitrage" },
              { value: "Pneumatiques", label: "Pneumatiques" },
              { value: "Autre", label: "Autre..." },
            ]}
          />
        </div>

        <div className="w-full sm:w-[200px]">
          <GlassSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Tous les niveaux de stock" },
              { value: "NORMAL", label: "Stock Normal" },
              { value: "FAIBLE", label: "Stock Faible" },
              { value: "RUPTURE", label: "Rupture de Stock" },
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
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Référence</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap w-[25%] sm:w-[35%]">Désignation & Marque</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Catégorie</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Emplacement</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Stock Actuel</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Seuil Min</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">État Stock</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton rows={8} />
                  </td>
                </tr>
              ) : pieces.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState 
                      title="Aucune pièce trouvée" 
                      message="Aucune référence ne correspond à vos filtres de recherche." 
                      icon={Package} 
                    />
                  </td>
                </tr>
              ) : (
                pieces.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-5">
                        <span className="font-mono text-[11px] font-bold text-[var(--color-electric-violet)] block">
                          {p.reference}
                        </span>
                      </td>
                      <td className="py-4 px-5 w-[25%] sm:w-[35%]">
                        <p className="text-xs font-bold text-white leading-relaxed break-words" title={p.designation}>
                          {p.designation}
                        </p>
                        <p className="text-[10px] text-white/40 mt-1 break-words">
                          Marque : {p.marque || "—"}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-white/60">{p.categorie}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-white/80">
                          <Layers className="h-3.5 w-3.5 text-white/40" />
                          <span className="font-mono font-bold">{p.emplacement || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-sm font-extrabold text-white">
                          {p.stock_actuel} <span className="text-[10px] text-white/40 font-normal">Pièce(s)</span>
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs text-white/60">
                          {p.stock_minimum} <span className="text-[10px] text-white/30 font-normal">Pièce(s)</span>
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold text-[10px] ${
                            p.statut_stock === "RUPTURE"
                              ? "text-red-400"
                              : p.statut_stock === "FAIBLE"
                              ? "text-[var(--color-turbo)]"
                              : "text-white"
                          }`}
                        >
                          {p.statut_stock === "RUPTURE" && <AlertTriangle className="h-3.5 w-3.5" />}
                          {p.statut_stock === "FAIBLE" && <AlertTriangle className="h-3.5 w-3.5" />}
                          {p.statut_stock === "NORMAL" && "Normal"}
                          {p.statut_stock === "RUPTURE" && "Rupture"}
                          {p.statut_stock === "FAIBLE" && "Faible"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEntry(p)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors shadow-sm"
                            title="Ajouter du stock"
                          >
                            <ArrowDownRight className="h-3.5 w-3.5" /> Entrée
                          </button>
                          <button
                            onClick={() => handleOpenAudit(p)}
                            className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors shadow-sm"
                            title="Historique des mouvements"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p.id, p.reference)}
                            className="p-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shadow-sm"
                            title="Archiver"
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
      <AddPieceModal
        isOpen={isAddPieceModalOpen}
        onClose={() => setIsAddPieceModalOpen(false)}
        onSuccess={() => fetchStock()}
      />
      <AddStockEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSuccess={() => fetchStock()}
        defaultPiece={selectedPiece}
        piecesList={pieces}
      />
      {selectedPiece && (
        <InventoryAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => {
            setIsAuditModalOpen(false);
            setSelectedPiece(null);
          }}
          onSuccess={() => fetchStock()}
          pieceId={selectedPiece.id}
          pieceRef={selectedPiece.reference}
          pieceName={selectedPiece.designation}
        />
      )}

      {/* Confirm Archiving Modal */}
      <GlassConfirmModal
        isOpen={confirmModal.isOpen}
        onCancel={() => setConfirmModal({ isOpen: false, pieceId: null, pieceRef: "", isLoading: false })}
        onConfirm={handleDeleteConfirm}
        title="Archiver la Pièce"
        message={`Êtes-vous sûr de vouloir archiver la pièce ${confirmModal.pieceRef} ?`}
        confirmText="Confirmer"
        cancelText="Annuler"
        isLoading={confirmModal.isLoading}
        type="danger"
      />
      </Portal>
    </div>
  );
}

