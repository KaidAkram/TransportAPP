"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GlassSelect } from "@/components/ui/GlassSelect";
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
} from "lucide-react";
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
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Portal } from "@/components/shared/Portal";

export default function PartenairesPage() {
  const [partners, setPartners] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.page = page.toString();
      if (roleFilter) params.role_partenaire = roleFilter;
      if (statusFilter) params.statut_crm = statusFilter;

      const res = await api.get<PartenaireListResponse>("/partenaires", params);
      setPartners(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching partners:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  
  useEffect(() => {
    setPage(1);
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
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-16 contain-layout">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <Users className="w-3 h-3" />
            Annuaire & Relations B2B
          </p>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
            Gestion des Partenaires & CRM
          </h1>
          <p className="text-sm text-white/50 mt-1 font-sans max-w-xl">
            Répertoire centralisé des clients conventions, agences de voyages et fournisseurs de pièces
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPartners}
            className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-bold text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all group"
          >
            <RefreshCw className={`h-4 w-4 mr-2 text-[var(--color-electric-violet)] transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
            Actualiser
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--color-electric-violet)] hover:bg-[#6c3ce0] px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(131,77,251,0.4)] border border-[var(--color-electric-violet)]/50 hover:shadow-[0_0_25px_rgba(131,77,251,0.6)] transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau Partenaire
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Total Entreprises</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{totalCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Comptes partenaires créés</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <Building2 className="h-5 w-5 text-white/80 group-hover:text-white" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Clients Actifs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{clientsActifs}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Conventions & circuits</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Prospects CRM</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-turbo)] drop-shadow-[0_0_10px_rgba(240,225,0,0.3)]">{prospects}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">En cours de négociation</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:border-[var(--color-turbo)]/40 transition-colors">
            <Clock className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Fournisseurs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-electric-violet)]">{fournisseurs}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Pièces & prestataires</p>
          </div>
          <div className="p-3 bg-[var(--color-electric-violet)]/10 rounded-full border border-[var(--color-electric-violet)]/20 group-hover:border-[var(--color-electric-violet)]/40 transition-colors">
            <Factory className="h-5 w-5 text-[var(--color-electric-violet)]" />
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards] space-y-4 relative z-50" style={{ animationDelay: '0.2s' }}>
        
        {/* Role Switcher Tabs */}
        <div className="flex p-1.5 bg-white/5 rounded-xl w-fit border border-white/5 min-w-0 max-w-full overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setRoleFilter("")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === ""
                ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_10px_rgba(131,77,251,0.2)]"
                : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Tous les comptes CRM
          </button>
          <button
            onClick={() => setRoleFilter("CLIENT")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === "CLIENT"
                ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_10px_rgba(131,77,251,0.2)]"
                : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Users className="h-4 w-4" />
            Clients & Agences B2B
          </button>
          <button
            onClick={() => setRoleFilter("FOURNISSEUR")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === "FOURNISSEUR"
                ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_10px_rgba(131,77,251,0.2)]"
                : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Factory className="h-4 w-4" />
            Fournisseurs & Pièces
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row gap-3 relative z-50 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 group-focus-within:text-[var(--color-electric-violet)] transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par raison sociale, NIF, email, téléphone ou RC..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:bg-[var(--color-haiti)] focus:border-[var(--color-electric-violet)] focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)]/50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            />
          </div>
          <div className="w-full md:w-56 shrink-0">
            <GlassSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "", label: "Tous les statuts CRM" },
                { value: "Actif", label: "Actif" },
                { value: "Prospect", label: "Prospect" },
                { value: "Inactif", label: "Inactif" },
                { value: "Bloqué", label: "Bloqué" },
              ]}
              placeholder="Filtrer par statut"
            />
          </div>
        </div>
      </div>

      {/* CRM Partner Table */}
        <div className="glass-panel overflow-hidden p-0 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
          <div className="min-w-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 bg-black/20">
                  <TableHead className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Entreprise / Raison Sociale</TableHead>
                  <TableHead className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Rôle</TableHead>
                  <TableHead className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Catégorie / Spécialité</TableHead>
                  <TableHead className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Interlocuteur Principal</TableHead>
                  <TableHead className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Ville / Wilaya</TableHead>
                  <TableHead className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold">Statut CRM</TableHead>
                  <TableHead className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0 border-0">
                    <TableSkeleton rows={6} />
                  </TableCell>
                </TableRow>
              ) : partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0 border-0">
                    <EmptyState 
                      title="Aucun partenaire" 
                      message="Aucun partenaire ne correspond à vos filtres de recherche." 
                      icon={Building2} 
                    />
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((p) => {
                  const isClient = p.role_partenaire === "CLIENT";

                  return (
                    <TableRow
                      key={p.id}
                      className="border-none hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <Link
                              href={`/partenaires/${p.id}`}
                              className="text-xs font-bold text-white hover:text-[var(--color-electric-violet)] transition-colors block"
                            >
                              {p.nom_commercial}
                            </Link>
                            {p.nif && (
                              <span className="font-mono text-[10px] text-white/40">
                                NIF : {p.nif}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            isClient
                              ? "bg-[var(--color-electric-violet)] text-white"
                              : "bg-[var(--color-turbo)] text-black"
                          }`}
                        >
                          {isClient ? <Users className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                          {isClient ? "Client" : "Fournisseur"}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {isClient
                          ? p.type_client || "Entreprise"
                          : p.specialite || "Catalogue Fournisseur"}
                      </TableCell>
                      <TableCell className="glass-td">
                        {p.contact_principal ? (
                          <div>
                            <p className="text-xs font-bold text-white">
                              {p.contact_principal.nom} {p.contact_principal.prenom}
                            </p>
                            <p className="text-[10px] text-white/50 font-mono mt-0.5">
                              {p.contact_principal.telephone || p.telephone_principal || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-white/40 italic">
                            {p.telephone_principal || "Aucun contact"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="border-none text-white/70">
                        {p.wilaya || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.statut_crm || "Actif"} />
                      </TableCell>
                      <TableCell className="border-none text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => window.location.href = `/partenaires/${p.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-[11px] font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5 text-white/50" /> Dossier
                          </button>
                          <button
                            onClick={() => handleArchive(p.id, p.nom_commercial)}
                            className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Archiver le partenaire"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
{/* Add Partner Modal */}
      <AddPartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchPartners()}
      />
      </Portal>
    </div>
  );
}

