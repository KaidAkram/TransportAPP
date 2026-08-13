"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Archive,
  Shield,
  Wrench,
  CheckCircle2,
  Clock,
  UserX,
  Phone,
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
import { AddEmployeeModal } from "@/components/modules/employes/AddEmployeeModal";
import { api } from "@/lib/api";
import { Employe, EmployeListResponse } from "@/types/employe";

export default function EmployesPage() {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.type_employe = roleFilter;
      if (statusFilter) params.statut = statusFilter;

      const res = await api.get<EmployeListResponse>("/employes", params);
      setEmployees(res.data.items);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Confirmez-vous le départ et l'archivage du collaborateur ${name} ?`)) {
      try {
        await api.patch(`/employes/${id}/archive`, {});
        fetchEmployees();
      } catch (err) {
        alert("Erreur lors de l'archivage de l'employé.");
      }
    }
  };

  // KPI Calculations
  const totalCount = employees.length;
  const actifs = employees.filter((e) => e.statut === "ACTIF").length;
  const absents = employees.filter((e) => e.statut === "ABSENT").length;
  const suspendus = employees.filter((e) => e.statut === "SUSPENDU" || e.statut === "QUITTE").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Gestion du Personnel & Équipes
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Supervision RH, chauffeurs grand tourisme, techniciens d&apos;atelier et permis de conduire
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmployees}
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
            Nouveau Collaborateur
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Effectif Total</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-primary font-mono">{totalCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Collaborateurs enregistrés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Personnel Actif</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-success-bg text-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success font-mono">{actifs}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">En poste & disponibles</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Absents / Congé</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-warning-bg text-warning-text">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning font-mono">{absents}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Congés & indisponibilités</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Suspendus / Quittés</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-danger-bg text-danger-text">
              <UserX className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-danger font-mono">{suspendus}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Inactifs ou archivés</p>
          </CardContent>
        </Card>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex border-b border-border bg-surface rounded-t-lg px-4 pt-2 gap-2">
        <button
          onClick={() => setRoleFilter("")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleFilter === ""
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Users className="h-4 w-4" />
          Tous les collaborateurs
        </button>
        <button
          onClick={() => setRoleFilter("CHAUFFEUR")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleFilter === "CHAUFFEUR"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Shield className="h-4 w-4" />
          Chauffeurs Professionnels
        </button>
        <button
          onClick={() => setRoleFilter("MECANICIEN")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleFilter === "MECANICIEN"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Mécaniciens & Atelier
        </button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-surface border-border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, prénom, matricule ou téléphone..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les statuts RH</option>
                <option value="ACTIF">🟢 Actif</option>
                <option value="ABSENT">🟠 Absent / Congé</option>
                <option value="SUSPENDU">🔴 Suspendu</option>
                <option value="QUITTE">⚪ Quitté</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personnel Data Table */}
      <Card className="bg-surface border-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Matricule</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Collaborateur</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Rôle / Métier</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Spécialité / Fonction</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Téléphone</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-text-secondary">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-base" />
                    Chargement du registre du personnel...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-primary">Aucun collaborateur trouvé</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ajustez vos filtres ou ajoutez un nouvel employé à l&apos;effectif.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((e) => {
                  const isChauffeur = e.type_employe === "CHAUFFEUR";
                  const avatarSrc =
                    e.photo ||
                    (isChauffeur
                      ? "/assets/avatars/driver_pro.jpg"
                      : "/assets/avatars/mechanic_pro.jpg");

                  return (
                    <TableRow
                      key={e.id}
                      className="border-b border-border hover:bg-primary-light/20 transition-colors"
                    >
                      <TableCell className="text-xs font-mono font-bold text-text-primary">
                        <Link href={`/employes/${e.id}`} className="hover:text-primary-base hover:underline">
                          {e.matricule}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border bg-table-header shrink-0">
                            {/* Executive Avatar Image with Fallback */}
                            <Image
                              src={avatarSrc}
                              alt={`${e.nom} ${e.prenom}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <Link
                              href={`/employes/${e.id}`}
                              className="text-xs font-semibold text-text-primary hover:text-primary-base transition-colors"
                            >
                              {e.nom} {e.prenom}
                            </Link>
                            {e.date_embauche && (
                              <p className="text-[11px] text-text-secondary">
                                Embauché le {new Date(e.date_embauche).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            isChauffeur
                              ? "bg-primary-light text-primary-base"
                              : "bg-warning-bg text-warning-text"
                          }`}
                        >
                          {isChauffeur ? <Shield className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                          {isChauffeur ? "Chauffeur" : "Mécanicien"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {isChauffeur
                          ? e.fonction || "Chauffeur Professionnel"
                          : e.specialite || e.fonction || "Atelier Mécanique"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-primary">
                        {e.telephone || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={e.statut} />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary-base hover:bg-primary-light/50 h-7 px-2.5"
                        >
                          <Link href={`/employes/${e.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Fiche RH
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(e.id, `${e.nom} ${e.prenom}`)}
                          className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                          title="Archiver l'employé"
                        >
                          <Archive className="h-3.5 w-3.5" />
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

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchEmployees()}
      />
    </div>
  );
}
