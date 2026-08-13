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
  DollarSign,
  CheckCircle2,
  Clock,
  Bus,
  UserCheck,
  AlertTriangle,
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
import { AddInterventionModal } from "@/components/modules/maintenance/AddInterventionModal";
import { api } from "@/lib/api";
import { Intervention, InterventionListResponse } from "@/types/intervention";

export default function MaintenancePage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.statut = statusFilter;

      const res = await api.get<InterventionListResponse>("/interventions", params);
      setInterventions(res.data.items);
    } catch (err) {
      console.error("Error fetching interventions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  const handleDelete = async (id: string, num: string) => {
    if (confirm(`Confirmez-vous l'annulation de l'ordre de travail ${num} ?`)) {
      try {
        await api.delete(`/interventions/${id}`);
        fetchInterventions();
      } catch (err) {
        alert("Erreur lors de l'annulation de l'intervention.");
      }
    }
  };

  // KPI calculations
  const totalCount = interventions.length;
  const termineesCount = interventions.filter((i) => i.statut === "TERMINEE").length;
  const enCoursCount = interventions.filter((i) => i.statut === "EN_COURS").length;
  const totalCoutDZD = interventions.reduce((acc, i) => acc + (i.cout_total || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Maintenance & Ordres de Travail (GMAO)
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Suivi des révisions, réparations préventives/correctives et traçabilité des pièces consommées
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInterventions}
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
            Nouvel Ordre de Travail
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Total Interventions</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-primary font-mono">{totalCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Ordres de travail enregistrés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Travaux Terminés</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-success-bg text-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success font-mono">{termineesCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Véhicules remis en circulation</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">En Cours Atelier</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-warning-bg text-warning-text">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning font-mono">{enCoursCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Véhicules immobilisés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Budget Maintenance DZD</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-primary-base font-mono truncate">
              {totalCoutDZD.toLocaleString("fr-DZ")} DZD
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Dépenses pièces & réparations</p>
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
                placeholder="Rechercher par n° OT, immatriculation, catégorie..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les types d&apos;intervention</option>
                <option value="PREVENTIVE">🟢 Maintenance Préventive</option>
                <option value="CORRECTIVE">🔴 Maintenance Corrective (Dépannage)</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les statuts</option>
                <option value="TERMINEE">🟢 Terminée</option>
                <option value="EN_COURS">🟠 En cours d&apos;intervention</option>
                <option value="PLANIFIEE">🟡 Planifiée</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interventions Table */}
      <Card className="bg-surface border-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">N° Ordre de Travail</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Véhicule</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Type & Catégorie</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Chef d&apos;Atelier / Mécanicien</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Date & Kilométrage</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Coût Travaux</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-text-secondary">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-base" />
                    Chargement du registre de maintenance...
                  </TableCell>
                </TableRow>
              ) : interventions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Wrench className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-primary">Aucun ordre de travail trouvé</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ajustez vos filtres ou lancez un nouvel ordre de réparation ou de révision.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                interventions.map((it) => {
                  const isPreventive = it.type === "PREVENTIVE";

                  return (
                    <TableRow
                      key={it.id}
                      className="border-b border-border hover:bg-primary-light/20 transition-colors"
                    >
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary-base block">
                          {it.numero}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bus className="h-3.5 w-3.5 text-primary-base" />
                          <div>
                            <p className="font-mono text-xs font-bold text-text-primary">
                              {it.vehicule_immatriculation || "Véhicule"}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                              {it.vehicule_marque} {it.vehicule_modele}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold mb-1 ${
                            isPreventive
                              ? "bg-primary-light text-primary-base"
                              : "bg-danger-bg text-danger-text"
                          }`}
                        >
                          {isPreventive ? "🟢 Préventive" : "🔴 Corrective"}
                        </span>
                        <p className="text-xs font-semibold text-text-primary">{it.categorie}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-text-secondary" />
                          <span className="text-xs font-medium text-text-primary">
                            {it.mecanicien_nom_complet || "Atelier Général"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-mono">
                        <div>{new Date(it.date).toLocaleDateString("fr-FR")}</div>
                        <div className="text-[10px] text-text-secondary font-bold">
                          {it.kilometrage.toLocaleString("fr-DZ")} KM
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-text-primary">
                          {it.cout_total.toLocaleString("fr-DZ")} DZD
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            it.statut === "TERMINEE"
                              ? "bg-success-bg text-success-text"
                              : it.statut === "EN_COURS"
                              ? "bg-warning-bg text-warning-text"
                              : "bg-neutral text-text-secondary"
                          }`}
                        >
                          {it.statut === "TERMINEE"
                            ? "Terminée"
                            : it.statut === "EN_COURS"
                            ? "En cours"
                            : "Planifiée"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(it.id, it.numero)}
                          className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                          title="Annuler l'intervention"
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

      {/* Add Intervention Modal */}
      <AddInterventionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchInterventions()}
      />
    </div>
  );
}
