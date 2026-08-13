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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddPieceModal } from "@/components/modules/stock/AddPieceModal";
import { AddStockEntryModal } from "@/components/modules/stock/AddStockEntryModal";
import { InventoryAuditModal } from "@/components/modules/stock/InventoryAuditModal";
import { api } from "@/lib/api";
import { Piece, PieceListResponse } from "@/types/stock";

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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.categorie = categoryFilter;
      if (statusFilter) params.statut_stock = statusFilter;

      const res = await api.get<PieceListResponse>("/stock/pieces", params);
      setPieces(res.data.items);
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

  const handleDelete = async (id: string, ref: string) => {
    if (confirm(`Confirmez-vous l'archivage de la pièce ${ref} ?`)) {
      try {
        await api.delete(`/stock/pieces/${id}`);
        fetchStock();
      } catch (err) {
        alert("Erreur lors de l'archivage de la pièce.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Gestion du Stock & Pièces Détachées
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Inventaire magasin, réceptions fournisseurs et déductions automatiques atelier
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStock}
            className="text-xs border-border h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEntry()}
            className="text-xs border-border text-success hover:bg-success-bg h-9"
          >
            <ArrowDownRight className="h-4 w-4 mr-1.5" />
            + Réception Livraison
          </Button>
          <Button
            onClick={() => setIsAddPieceModalOpen(true)}
            size="sm"
            className="text-xs bg-primary-base hover:bg-primary-base/90 text-white h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle Pièce
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Total Références</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-primary font-mono">{kpiData.total_references}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Articles au catalogue magasin</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Stock Normal</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-success-bg text-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success font-mono">{kpiData.total_stock_normal}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Niveau de stock optimal</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Stock Faible (&le; Min)</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-warning-bg text-warning-text">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning font-mono">{kpiData.total_stock_faible}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">À commander rapidement</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Rupture de Stock</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-danger-bg text-danger-text">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-danger font-mono">{kpiData.total_rupture}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Stock épuisé (0 dispo)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="bg-surface border-border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par réf, désignation, marque, emplacement..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Toutes les catégories</option>
                <option value="Filtres">Filtres (Huile, Air, Gazole)</option>
                <option value="Freinage">Freinage (Plaquettes, Disques)</option>
                <option value="Moteur">Moteur & Courroies</option>
                <option value="Pneumatiques">Pneumatiques</option>
                <option value="Électricité">Électricité & Batteries</option>
                <option value="Lubrifiants">Lubrifiants</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les niveaux de stock</option>
                <option value="NORMAL">🟢 Stock Normal</option>
                <option value="FAIBLE">🟠 Stock Faible</option>
                <option value="RUPTURE">🔴 Rupture de Stock</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card className="bg-surface border-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Référence</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Désignation & Marque</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Catégorie</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Emplacement</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Stock Actuel</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Seuil Min</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">État Stock</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-text-secondary">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-base" />
                    Chargement du stock magasin...
                  </TableCell>
                </TableRow>
              ) : pieces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Package className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-primary">Aucun article trouvé</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ajustez vos filtres ou ajoutez une nouvelle référence de pièce.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pieces.map((p) => {
                  const isRupture = p.statut_stock === "RUPTURE";
                  const isFaible = p.statut_stock === "FAIBLE";

                  return (
                    <TableRow
                      key={p.id}
                      className="border-b border-border hover:bg-primary-light/20 transition-colors"
                    >
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary-base block">
                          {p.reference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-text-primary">{p.designation}</p>
                        {p.marque && (
                          <span className="text-[11px] text-text-secondary">Marque : {p.marque}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-medium">
                        {p.categorie}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center font-mono text-xs font-semibold rounded bg-neutral px-2 py-0.5 text-text-primary">
                          📍 {p.emplacement || "Non assigné"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-mono text-xs font-bold ${
                            isRupture
                              ? "text-danger"
                              : isFaible
                              ? "text-warning"
                              : "text-text-primary"
                          }`}
                        >
                          {p.stock_actuel} {p.unite}(s)
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-secondary">
                        {p.stock_minimum} {p.unite}(s)
                      </TableCell>
                      <TableCell>
                        {isRupture ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-bold text-danger-text animate-pulse">
                            🔴 Rupture
                          </span>
                        ) : isFaible ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-bold text-warning-text">
                            🟠 Stock Faible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success-text">
                            🟢 Normal
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEntry(p)}
                          className="text-xs border-border text-success hover:bg-success-bg h-7 px-2"
                          title="Réceptionner livraison"
                        >
                          <ArrowDownRight className="h-3.5 w-3.5 mr-1" /> + Entrée
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAudit(p)}
                          className="text-xs border-border text-warning hover:bg-warning-bg h-7 px-2"
                          title="Ajustement inventaire physique"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id, p.reference)}
                          className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                          title="Archiver l'article"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
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
      <InventoryAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onSuccess={() => fetchStock()}
        piece={selectedPiece}
      />
    </div>
  );
}
