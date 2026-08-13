"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Archive,
  Users,
  Factory,
  CheckCircle2,
  Clock,
  Ban,
  Phone,
  Mail,
  MapPin,
  FileText,
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
import { AddPartnerModal } from "@/components/modules/partenaires/AddPartnerModal";
import { api } from "@/lib/api";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";

export default function PartenairesPage() {
  const [partners, setPartners] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.role_partenaire = roleFilter;
      if (statusFilter) params.statut_crm = statusFilter;

      const res = await api.get<PartenaireListResponse>("/partenaires", params);
      setPartners(res.data.items);
    } catch (err) {
      console.error("Error fetching partners:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Confirmez-vous l'archivage du partenaire ${name} ?`)) {
      try {
        await api.patch(`/partenaires/${id}/archive`, {});
        fetchPartners();
      } catch (err) {
        alert("Erreur lors de l'archivage du partenaire.");
      }
    }
  };

  // KPI calculations
  const totalCount = partners.length;
  const clientsActifs = partners.filter((p) => p.role_partenaire === "CLIENT" && p.statut_crm === "Actif").length;
  const prospects = partners.filter((p) => p.statut_crm === "Prospect").length;
  const fournisseurs = partners.filter((p) => p.role_partenaire === "FOURNISSEUR").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Gestion des Partenaires & CRM
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Répertoire centralisé des clients conventions, agences de voyages et fournisseurs de pièces
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPartners}
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
            Nouveau Partenaire
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Total Entreprises</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-primary font-mono">{totalCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Comptes partenaires créés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Clients Actifs</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-success-bg text-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success font-mono">{clientsActifs}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Conventions & circuits</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Prospects CRM</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-warning-bg text-warning-text">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning font-mono">{prospects}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">En cours de négociation</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Fournisseurs</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <Factory className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary-base font-mono">{fournisseurs}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Pièces & prestataires</p>
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
          <Building2 className="h-4 w-4" />
          Tous les comptes CRM
        </button>
        <button
          onClick={() => setRoleFilter("CLIENT")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleFilter === "CLIENT"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Users className="h-4 w-4" />
          Clients & Agences B2B
        </button>
        <button
          onClick={() => setRoleFilter("FOURNISSEUR")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleFilter === "FOURNISSEUR"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Factory className="h-4 w-4" />
          Fournisseurs & Pièces
        </button>
      </div>

      {/* Search & Status Filters */}
      <Card className="bg-surface border-border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par raison sociale, NIF, email, téléphone ou RC..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les statuts CRM</option>
                <option value="Actif">🟢 Actif</option>
                <option value="Prospect">🟡 Prospect</option>
                <option value="Inactif">⚫ Inactif</option>
                <option value="Bloqué">🔴 Bloqué</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRM Partner Table */}
      <Card className="bg-surface border-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Entreprise / Raison Sociale</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Rôle</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Catégorie / Spécialité</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Interlocuteur Principal</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Ville / Wilaya</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut CRM</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-text-secondary">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-base" />
                    Chargement du portefeuille CRM...
                  </TableCell>
                </TableRow>
              ) : partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Building2 className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-primary">Aucun partenaire trouvé</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ajustez vos filtres ou ajoutez un nouveau compte client ou fournisseur.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((p) => {
                  const isClient = p.role_partenaire === "CLIENT";
                  const logoSrc =
                    p.logo ||
                    (isClient
                      ? "/assets/logos/client_default.jpg"
                      : "/assets/logos/supplier_default.jpg");

                  return (
                    <TableRow
                      key={p.id}
                      className="border-b border-border hover:bg-primary-light/20 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-border bg-white p-1 shrink-0">
                            <Image
                              src={logoSrc}
                              alt={p.nom_commercial}
                              fill
                              className="object-contain p-0.5"
                              unoptimized
                            />
                          </div>
                          <div>
                            <Link
                              href={`/partenaires/${p.id}`}
                              className="text-xs font-bold text-text-primary hover:text-primary-base transition-colors block"
                            >
                              {p.nom_commercial}
                            </Link>
                            {p.nif && (
                              <span className="font-mono text-[10px] text-text-secondary">
                                NIF : {p.nif}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            isClient
                              ? "bg-primary-light text-primary-base"
                              : "bg-warning-bg text-warning-text"
                          }`}
                        >
                          {isClient ? <Users className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                          {isClient ? "Client" : "Fournisseur"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {isClient
                          ? p.type_client || "Entreprise"
                          : p.specialite || "Catalogue Fournisseur"}
                      </TableCell>
                      <TableCell>
                        {p.contact_principal ? (
                          <div>
                            <p className="text-xs font-semibold text-text-primary">
                              {p.contact_principal.nom} {p.contact_principal.prenom}
                            </p>
                            <p className="text-[11px] text-text-secondary font-mono">
                              {p.contact_principal.telephone || p.telephone_principal || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary">
                            {p.telephone_principal || "Aucun contact"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {p.wilaya || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            p.statut_crm === "Actif"
                              ? "bg-success-bg text-success-text"
                              : p.statut_crm === "Prospect"
                              ? "bg-warning-bg text-warning-text"
                              : p.statut_crm === "Bloqué"
                              ? "bg-danger-bg text-danger-text"
                              : "bg-neutral text-text-secondary"
                          }`}
                        >
                          {p.statut_crm || "Actif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary-base hover:bg-primary-light/50 h-7 px-2.5"
                        >
                          <Link href={`/partenaires/${p.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Dossier CRM
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(p.id, p.nom_commercial)}
                          className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                          title="Archiver le partenaire"
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

      {/* Add Partner Modal */}
      <AddPartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchPartners()}
      />
    </div>
  );
}
