"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bus,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Archive,
  CheckCircle2,
  Clock,
  Wrench,
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddVehicleModal } from "@/components/modules/vehicules/AddVehicleModal";
import { api } from "@/lib/api";
import { Vehicule, VehiculeListResponse } from "@/types/vehicule";

export default function VehiculesPage() {
  const [vehicles, setVehicles] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch vehicles from API
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.statut = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await api.get<VehiculeListResponse>("/vehicules", params);
      setVehicles(res.data.items);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleArchive = async (id: string, immat: string) => {
    if (confirm(`Confirmez-vous la mise hors service et l'archivage du véhicule ${immat} ?`)) {
      try {
        await api.patch(`/vehicules/${id}/archive`, {});
        fetchVehicles();
      } catch (err) {
        alert("Erreur lors de l'archivage du véhicule.");
      }
    }
  };

  // KPI Calculations
  const totalCount = vehicles.length;
  const disponibles = vehicles.filter((v) => v.statut === "DISPONIBLE").length;
  const enMission = vehicles.filter((v) => v.statut === "EN_MISSION").length;
  const maintenance = vehicles.filter((v) => v.statut === "MAINTENANCE" || v.statut === "IMMOBILISE").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Gestion du Parc Automobile
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Supervision de la flotte, suivi kilométrique, conformité documentaire et maintenance
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVehicles}
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
            Nouveau Véhicule
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Total Véhicules</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <Bus className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-primary font-mono">{totalCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Flotte active sous gestion</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Disponibles</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-success-bg text-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success font-mono">{disponibles}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Prêts pour affectation</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">En Mission</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-warning-bg text-warning-text">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning font-mono">{enMission}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Sur route actuellement</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Maintenance / Arrêt</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-danger-bg text-danger-text">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-danger font-mono">{maintenance}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Atelier ou immobilisés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-surface border-border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Text Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par immatriculation, marque ou modèle..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les types</option>
                <option value="Bus">Bus</option>
                <option value="Minibus">Minibus</option>
                <option value="Voiture">Voiture</option>
                <option value="Van">Van / Fourgon</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les statuts</option>
                <option value="DISPONIBLE">Disponible</option>
                <option value="EN_MISSION">En mission</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="IMMOBILISE">Immobilisé</option>
                <option value="HORS_SERVICE">Hors service</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Data Table */}
      <Card className="bg-surface border-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Immatriculation</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Véhicule (Marque & Modèle)</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Type</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Places</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Kilométrage</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-text-secondary">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-base" />
                    Chargement des données du parc...
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Bus className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-primary">Aucun véhicule trouvé</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ajustez vos filtres ou ajoutez un nouveau véhicule à la flotte.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow
                    key={v.id}
                    className="border-b border-border hover:bg-primary-light/20 transition-colors"
                  >
                    <TableCell className="text-xs font-mono font-bold text-text-primary">
                      <Link href={`/vehicules/${v.id}`} className="hover:text-primary-base hover:underline">
                        {v.immatriculation}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-text-primary font-medium">
                      {v.marque} {v.modele}
                      {v.annee && <span className="text-[11px] text-text-secondary ml-1.5">({v.annee})</span>}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">{v.type}</TableCell>
                    <TableCell className="text-xs text-text-secondary font-mono">{v.nombre_places} pl.</TableCell>
                    <TableCell className="text-xs font-mono text-text-primary">
                      {v.kilometrage_actuel.toLocaleString("fr-FR")} km
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.statut} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary-base hover:bg-primary-light/50 h-7 px-2.5"
                      >
                        <Link href={`/vehicules/${v.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Fiche
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(v.id, v.immatriculation)}
                        className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                        title="Archiver le véhicule"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchVehicles();
        }}
      />
    </div>
  );
}
