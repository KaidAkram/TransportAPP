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
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Factory,
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddContractModal } from "@/components/modules/contrats/AddContractModal";
import { api } from "@/lib/api";
import { Contrat, ContratListResponse } from "@/types/contrat";

export default function ContratsPage() {
  const [contracts, setContracts] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.statut = statusFilter;
      if (typeFilter) params.type_contrat = typeFilter;

      const res = await api.get<ContratListResponse>("/contrats", params);
      setContracts(res.data.items);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleDelete = async (id: string, ref: string) => {
    if (confirm(`Confirmez-vous l'archivage du contrat ${ref} ?`)) {
      try {
        await api.delete(`/contrats/${id}`);
        fetchContracts();
      } catch (err) {
        alert("Erreur lors de l'archivage du contrat.");
      }
    }
  };

  // KPI Calculations
  const totalCount = contracts.length;
  const actifsCount = contracts.filter((c) => c.statut === "ACTIF").length;
  const expirantBientotCount = contracts.filter(
    (c) => c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants >= 0 && c.jours_restants <= 30
  ).length;
  const totalVolumeDZD = contracts.reduce((acc, c) => acc + (c.montant || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Gestion des Contrats & Conventions
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Suivi des accords commerciaux, avenants d&apos;extension et alertes d&apos;échéances
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContracts}
            className="text-xs border-border h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="text-xs bg-primary-base hover:bg-primary-base/90 text-white h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouveau Contrat
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Total Conventions</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-primary font-mono">{totalCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Accords contractuels enregistrés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Contrats Actifs</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-success-bg text-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success font-mono">{actifsCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">En cours d&apos;exécution</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Échéance &le; 30 jours</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-warning-bg text-warning-text">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning font-mono">{expirantBientotCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">À renouveler rapidement</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Volume Financier Global</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-primary-base font-mono truncate">
              {totalVolumeDZD.toLocaleString("fr-DZ")} DZD
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Engagement financier total</p>
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
                placeholder="Rechercher par référence, objet ou partenaire..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les statuts</option>
                <option value="ACTIF">🟢 Contrats Actifs</option>
                <option value="EXPIRE">🔴 Contrats Expirés</option>
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les types de contrat</option>
                <option value="Transport">Transport Régulier / Navettes</option>
                <option value="Tourisme">Circuits Touristiques</option>
                <option value="Location">Location d&apos;Autocars</option>
                <option value="Fourniture">Fourniture de Pièces</option>
                <option value="Maintenance">Prestations de Maintenance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card className="bg-surface border-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Réf. Contrat</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Partenaire Contractant</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Type & Objet</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Montant Global</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Période d&apos;Effet</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Échéance & Alerte</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-text-secondary">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-base" />
                    Chargement du registre contractuel...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <FileText className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-primary">Aucun contrat trouvé</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ajustez vos filtres ou ajoutez une nouvelle convention.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => {
                  const isClient = c.partenaire_role === "CLIENT";
                  const isUrgent = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants >= 0 && c.jours_restants <= 7;
                  const isWarning = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants > 7 && c.jours_restants <= 30;
                  const isExpired = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants < 0;

                  return (
                    <TableRow
                      key={c.id}
                      className="border-b border-border hover:bg-primary-light/20 transition-colors"
                    >
                      <TableCell>
                        <Link
                          href={`/contrats/${c.id}`}
                          className="font-mono text-xs font-bold text-primary-base hover:underline block"
                        >
                          {c.reference}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-bold text-text-primary">
                            {c.partenaire_nom || "Entreprise"}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-semibold mt-0.5 ${
                              isClient
                                ? "bg-primary-light text-primary-base"
                                : "bg-warning-bg text-warning-text"
                            }`}
                          >
                            {isClient ? <Users className="h-2.5 w-2.5" /> : <Factory className="h-2.5 w-2.5" />}
                            {isClient ? "Client" : "Fournisseur"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold text-text-primary truncate max-w-[200px]" title={c.objet}>
                          {c.objet}
                        </p>
                        <span className="text-[11px] text-text-secondary">{c.type_contrat}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-text-primary">
                          {c.montant.toLocaleString("fr-DZ")} {c.devise}
                        </span>
                        {c.mode_facturation && (
                          <p className="text-[10px] text-text-secondary">{c.mode_facturation}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-mono">
                        {new Date(c.date_debut).toLocaleDateString("fr-FR")} &rarr;{" "}
                        {new Date(c.date_fin).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-bold text-danger-text">
                            🔴 Expiré
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-bold text-danger-text animate-pulse">
                            🔴 {c.alerte_expiration}
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-bold text-warning-text">
                            🟠 {c.alerte_expiration}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success-text">
                            🟢 Valide ({c.jours_restants} j)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            c.statut === "ACTIF"
                              ? "bg-success-bg text-success-text"
                              : "bg-danger-bg text-danger-text"
                          }`}
                        >
                          {c.statut}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary-base hover:bg-primary-light/50 h-7 px-2.5"
                        >
                          <Link href={`/contrats/${c.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Dossier
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id, c.reference)}
                          className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                          title="Archiver le contrat"
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

      {/* Add Contract Modal */}
      <AddContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchContracts()}
      />
    </div>
  );
}
