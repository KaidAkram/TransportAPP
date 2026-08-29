"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Archive,
  Shield,
  Wrench,
  CheckCircle2,
  Clock,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddEmployeeModal } from "@/components/modules/employes/AddEmployeeModal";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { api } from "@/lib/api";
import { Employe, EmployeListResponse } from "@/types/employe";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Portal } from "@/components/shared/Portal";
import { SortableHeader } from "@/components/ui/SortableHeader";

export default function EmployesPage() {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"actifs" | "archives">("actifs");
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
    employeeId: string | null;
    employeeName: string;
    isLoading: boolean;
    action: "archive" | "restore";
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: "",
    isLoading: false,
    action: "archive",
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.page = page.toString();
      if (roleFilter) params.type_employe = roleFilter;
      
      if (viewMode === "archives") {
        params.include_archived = "true";
        params.statut = "QUITTE";
      } else if (statusFilter) {
        params.statut = statusFilter;
      }
      
      if (yearFilter) params.annee = yearFilter;
      if (monthFilter) params.mois = monthFilter;

      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }

      const res = await api.get<EmployeListResponse>("/employes", params);
      setEmployees(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, yearFilter, monthFilter, page, sortBy, sortOrder, viewMode]);

  
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, yearFilter, monthFilter, sortBy, sortOrder, viewMode]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleArchiveClick = (id: string, name: string) => {
    setConfirmModal({ isOpen: true, employeeId: id, employeeName: name, isLoading: false, action: "archive" });
  };

  const handleRestoreClick = (id: string, name: string) => {
    setConfirmModal({ isOpen: true, employeeId: id, employeeName: name, isLoading: false, action: "restore" });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.employeeId) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (confirmModal.action === "archive") {
        await api.patch(`/employes/${confirmModal.employeeId}/archive`, {});
      } else {
        await api.patch(`/employes/${confirmModal.employeeId}/restore`, {});
      }
      fetchEmployees();
    } catch (err) {
      console.error("Erreur lors de l'action:", err);
    } finally {
      setConfirmModal({ isOpen: false, employeeId: null, employeeName: "", isLoading: false, action: "archive" });
    }
  };

  // KPI Calculations
  const totalCount = employees.length;
  const actifs = employees.filter((e) => e.statut === "ACTIF").length;
  const absents = employees.filter((e) => e.statut === "ABSENT").length;
  const suspendus = employees.filter((e) => e.statut === "SUSPENDU" || e.statut === "QUITTE").length;

  const roleTabClass = (isActive: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
      isActive
        ? "bg-white/10 text-white border border-white/20 shadow-sm"
        : "text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent"
    }`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-electric-violet)] animate-pulse" />
            <span className="text-[10px] font-accent font-bold uppercase tracking-[0.2em] text-[var(--color-electric-violet)]">
              Capital Humain
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight drop-shadow-md">
            Ressources Humaines
          </h1>
          <p className="text-sm text-white/50 mt-1 max-w-xl">
            Gestion du personnel naviguant et technique de l'entreprise.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmployees}
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
            Nouveau Collaborateur
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Effectif Total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{totalCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Personnel enregistré</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <Users className="h-5 w-5 text-white/80 group-hover:text-white" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">En Service</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-electric-violet)] drop-shadow-[0_0_10px_rgba(131,77,251,0.3)]">{actifs}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Collaborateurs actifs</p>
          </div>
          <div className="p-3 bg-[var(--color-electric-violet)]/10 rounded-full border border-[var(--color-electric-violet)]/20 group-hover:border-[var(--color-electric-violet)]/40 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-[var(--color-electric-violet)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Absents / Congé</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-turbo)]">{absents}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Non disponibles</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:border-[var(--color-turbo)]/40 transition-colors">
            <Clock className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Inactifs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white/60">{suspendus}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">Quitté ou Suspendu</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/10 group-hover:border-white/20 transition-colors">
            <UserX className="h-5 w-5 text-white/40" />
          </div>
        </div>
      </div>

      {/* Modern Pill Tabs for Roles */}
      <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 w-fit min-w-0 max-w-full opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.15s' }}>
        <button onClick={() => setRoleFilter("")} className={roleTabClass(roleFilter === "")}>
          <Users className="h-3.5 w-3.5" />
          Tous les collaborateurs
        </button>
        <button onClick={() => setRoleFilter("CHAUFFEUR")} className={roleTabClass(roleFilter === "CHAUFFEUR")}>
          <Shield className="h-3.5 w-3.5" />
          Chauffeurs Professionnels
        </button>
        <button onClick={() => setRoleFilter("MECANICIEN")} className={roleTabClass(roleFilter === "MECANICIEN")}>
          <Wrench className="h-3.5 w-3.5" />
          Mécaniciens & Atelier
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="relative z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom, matricule ou téléphone..."
            className="w-full !pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[var(--color-haiti)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 bg-black/20 border border-white/10 rounded-xl flex">
            <button
              onClick={() => setViewMode("actifs")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "actifs" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => setViewMode("archives")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "archives" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
              }`}
            >
              Archivés
            </button>
          </div>
          
          <GlassSelect
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Rôle / Métier"
            options={[
              { value: "", label: "Tous les rôles" },
              { value: "CHAUFFEUR", label: "Chauffeurs" },
              { value: "MECANICIEN", label: "Mécaniciens" },
            ]}
          />
          <GlassSelect
            value={yearFilter}
            onChange={setYearFilter}
            placeholder="Année"
            options={[
              { value: "", label: "Toutes les années" },
              ...Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: year.toString(), label: year.toString() };
              }),
            ]}
          />
          {viewMode === "actifs" && (
            <GlassSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Statut RH"
              options={[
                { value: "", label: "Tous statuts" },
                { value: "ACTIF", label: "Actifs" },
                { value: "ABSENT", label: "Absents" },
                { value: "SUSPENDU", label: "Suspendus" },
              ]}
            />
          )}
        </div>
      </div>

      {/* Personnel Data Table */}
      <div className="glass-panel overflow-hidden p-0 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.25s' }}>
        <div className="overflow-hidden">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-black/20 border-b border-white/10 text-white/40 font-accent uppercase tracking-widest">
              <tr>
                <SortableHeader label="Matricule" field="matricule" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[10%]" />
                <SortableHeader label="Collaborateur" field="nom" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[22%]" />
                <SortableHeader label="Rôle / Métier" field="type_employe" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[12%]" />
                <th className="py-3 px-3 w-[22%] text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap select-none">Spécialité / Fonction</th>
                <SortableHeader label="Téléphone" field="telephone" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[10%]" />
                <SortableHeader label="Statut" field="statut" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[10%]" />
                <th className="py-3 px-3 text-right w-[14%] text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap select-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState 
                      title="Aucun collaborateur" 
                      message="Aucun collaborateur ne correspond à vos critères de recherche." 
                      icon={Users} 
                    />
                  </td>
                </tr>
              ) : (
                employees.map((e) => {
                  const isChauffeur = e.type_employe === "CHAUFFEUR";
                  const avatarSrc =
                    e.photo ||
                    (isChauffeur
                      ? "/assets/avatars/driver_pro.jpg"
                      : "/assets/avatars/mechanic_pro.jpg");

                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-white/5 transition-colors group relative cursor-pointer"
                    >
                      <td className="py-3 px-3 text-xs font-mono font-bold truncate">
                        <Link href={`/employes/${e.id}`} className="text-white/80 group-hover:text-[var(--color-electric-violet)] transition-colors underline-offset-4 group-hover:underline before:absolute before:inset-0 before:z-10 block">
                          {e.matricule}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 shrink-0">
                            <div className="relative h-full w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                              <Image
                                src={avatarSrc}
                                alt={`${e.nom} ${e.prenom}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            {e.dossier_complet === false && (
                              <div className="absolute -top-1.5 -right-1.5 group/tooltip flex items-center justify-center z-20">
                                <AlertTriangle className="h-4 w-4 text-[var(--color-turbo)] fill-[var(--color-turbo)]/20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/tooltip:block w-max bg-[var(--color-turbo)] text-black text-[10px] py-0.5 px-1.5 rounded font-bold shadow-lg z-50">
                                  Dossier incomplet
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/employes/${e.id}`}
                              className="text-xs font-semibold text-white group-hover:text-[var(--color-electric-violet)] transition-colors truncate block"
                            >
                              {e.nom} {e.prenom}
                            </Link>
                            {e.date_embauche && (
                              <p className="text-[10px] text-white/40 truncate">
                                Embauché le {new Date(e.date_embauche).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                            isChauffeur
                              ? "bg-[var(--color-electric-violet)] text-white"
                              : "bg-[var(--color-turbo)] text-black"
                          }`}
                        >
                          {isChauffeur ? <Shield className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                          {isChauffeur ? "Chauffeur" : "Mécanicien"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-white/60 truncate">
                        {isChauffeur
                          ? e.fonction || "Chauffeur Professionnel"
                          : e.specialite || e.fonction || "Atelier Mécanique"}
                      </td>
                      <td className="py-3 px-3 text-xs font-mono text-white/80 truncate">
                        {e.telephone || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={e.statut} />
                      </td>
                      <td className="py-3 px-3 text-right relative z-20">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/employes/${e.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/50 hover:bg-[var(--color-electric-violet)]/30 hover:border-[var(--color-electric-violet)]/70 transition-all text-[10px] font-bold font-accent uppercase tracking-wider whitespace-nowrap shadow-[0_0_15px_rgba(131,77,251,0.2)]"
                          >
                            <Eye className="h-3.5 w-3.5" /> Fiche RH
                          </Link>
                          {e.statut !== "QUITTE" ? (
                            <button
                              onClick={() => handleArchiveClick(e.id, `${e.nom} ${e.prenom}`)}
                              className="p-1 rounded-lg border border-white/10 bg-white/5 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                              title="Archiver l'employé"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreClick(e.id, `${e.nom} ${e.prenom}`)}
                              className="p-1 rounded-lg border border-white/10 bg-white/5 text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
                              title="Désarchiver l'employé"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}
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
{/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchEmployees()}
      />

      {/* Archive Confirmation Modal */}
      <GlassConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === "archive" ? "Archiver le collaborateur" : "Désarchiver le collaborateur"}
        message={
          confirmModal.action === "archive"
            ? `Confirmez-vous le départ et l'archivage du collaborateur ${confirmModal.employeeName} ? Cette action changera son statut en "Quitté".`
            : `Confirmez-vous le retour du collaborateur ${confirmModal.employeeName} ? Son profil redeviendra "Actif".`
        }
        confirmText={confirmModal.action === "archive" ? "Confirmer l'archivage" : "Désarchiver"}
        cancelText="Annuler"
        type={confirmModal.action === "archive" ? "danger" : "info"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, employeeId: null, employeeName: "", isLoading: false, action: "archive" })}
        isLoading={confirmModal.isLoading}
      />
      </Portal>
    </div>
  );
}

