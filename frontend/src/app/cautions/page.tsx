"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  Search,
  RefreshCw,
  Download,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
  Upload,
  ArrowRight,
} from "lucide-react";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { NouvelleDemandeModal } from "@/components/modules/cautions/NouvelleDemandeModal";
import { UploadCautionModal } from "@/components/modules/cautions/UploadCautionModal";
import { api } from "@/lib/api";
import { Caution, CautionListResponse } from "@/types/caution";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Portal } from "@/components/shared/Portal";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSettingsStore } from "@/stores/settingsStore";
import { translations, SupportedLanguage } from "@/lib/i18n";

export default function CautionsPage() {
  const { userPreferences } = useSettingsStore();
  const currentLang = (userPreferences?.language as SupportedLanguage) || "fr";
  const t = translations[currentLang] || translations.fr;
  const [cautions, setCautions] = useState<Caution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [isDemandeModalOpen, setIsDemandeModalOpen] = useState(false);
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

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    cautionId: string | null;
    cautionNum: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    cautionId: null,
    cautionNum: "",
    isLoading: false,
  });

  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    caution: Caution | null;
    step: "ORIGINALE" | "PREUVE";
  }>({
    isOpen: false,
    caution: null,
    step: "ORIGINALE",
  });

  const fetchCautions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      params.page = page.toString();
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.statut = statusFilter;
      if (yearFilter) params.annee = yearFilter;
      if (monthFilter) params.mois = monthFilter;
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }

      const res = await api.get<CautionListResponse>("/cautions", params);
      setCautions(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching cautions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, yearFilter, monthFilter, page, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, yearFilter, monthFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCautions();
  }, [fetchCautions]);

  const handleDeleteClick = (id: string, num: string) => {
    setConfirmModal({ isOpen: true, cautionId: id, cautionNum: num, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.cautionId) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.delete(`/cautions/${confirmModal.cautionId}`);
      fetchCautions();
    } catch (err) {
      console.error("Erreur lors de l'archivage de la caution:", err);
    } finally {
      setConfirmModal({ isOpen: false, cautionId: null, cautionNum: "", isLoading: false });
    }
  };

  const totalCount = cautions.length;
  const creationCount = cautions.filter((c) => c.statut === "CREATION").length;
  const chezClientCount = cautions.filter((c) => c.statut === "CHEZ_CLIENT").length;
  const retourneeCount = cautions.filter((c) => c.statut === "RETOURNEE" || c.statut === "MAIN_LEVEE").length;
  const totalGarantiDZD = cautions
    .filter((c) => c.statut === "CREATION" || c.statut === "CHEZ_CLIENT")
    .reduce((acc, c) => acc + (c.montant || 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ms-0.5 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            {t.cautionsHeaderPrefix}
          </p>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
            {t.cautionsTitle}
          </h1>
          <p className="text-sm text-white/60 mt-1 font-sans max-w-xl">
            {t.cautionsSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCautions}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group"
          >
            <RefreshCw className={`h-4 w-4 text-[var(--color-electric-violet)] transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
            {t.refresh}
          </button>
          <button
            onClick={() => setIsDemandeModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-electric-violet)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6c3ce0] transition-colors shadow-[0_0_15px_rgba(131,77,251,0.4)] hover:shadow-[0_0_25px_rgba(131,77,251,0.6)]"
          >
            <Plus className="h-4 w-4" />
            {t.newRequest || 'Nouvelle Demande'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">{t.totalCautions}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{totalCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">{t.totalCautionsDesc}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <ShieldCheck className="h-5 w-5 text-white/80 group-hover:text-white" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">{t.inCreation}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-electric-violet)] drop-shadow-[0_0_10px_rgba(131,77,251,0.3)]">{creationCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">{t.inCreationDesc}</p>
          </div>
          <div className="p-3 bg-[var(--color-electric-violet)]/10 rounded-full border border-[var(--color-electric-violet)]/20 group-hover:border-[var(--color-electric-violet)]/40 transition-colors">
            <FileText className="h-5 w-5 text-[var(--color-electric-violet)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">{t.atClient}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-[var(--color-turbo)] drop-shadow-[0_0_10px_rgba(240,225,0,0.3)]">{chezClientCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">{t.atClientDesc}</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:border-[var(--color-turbo)]/40 transition-colors">
            <Clock className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 hover:bg-white/[0.02] transition-colors group overflow-hidden">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">{t.guaranteedAmount}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-[var(--color-electric-violet)] whitespace-nowrap">{totalGarantiDZD.toLocaleString("fr-DZ")}</span>
              <span className="text-[10px] font-bold text-white/40 shrink-0">DZD</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">{t.guaranteedAmountDesc}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-20 flex flex-wrap gap-3 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <div className="relative w-full lg:w-auto lg:flex-1 min-w-[250px] group">
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40 group-focus-within:text-[var(--color-electric-violet)] transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchCaution}
            className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[var(--color-haiti)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] font-medium"
          />
        </div>

        <div className="w-[calc(50%-6px)] sm:w-auto sm:min-w-[220px]">
          <GlassSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "", label: t.allCautionTypes },
              { value: "DEMANDE", label: t.typeDemande },
              { value: "SOUMISSION", label: t.typeSoumission },
              { value: "BONNE_EXECUTION", label: t.typeBonneExec },
            ]}
          />
        </div>

        <div className="w-[calc(50%-6px)] sm:w-auto sm:min-w-[150px]">
          <GlassSelect
            value={yearFilter}
            onChange={setYearFilter}
            options={[
              { value: "", label: t.allYears || "Toutes les années" },
              ...Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: year.toString(), label: year.toString() };
              }),
            ]}
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-auto sm:min-w-[150px]">
          <GlassSelect
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder={t.allMonths}
            options={[
              { value: "", label: t.allMonths },
              { value: "1", label: "Janvier" },
              { value: "2", label: "Février" },
              { value: "3", label: "Mars" },
              { value: "4", label: "Avril" },
              { value: "5", label: "Mai" },
              { value: "6", label: "Juin" },
              { value: "7", label: "Juillet" },
              { value: "8", label: "Août" },
              { value: "9", label: "Septembre" },
              { value: "10", label: "Octobre" },
              { value: "11", label: "Novembre" },
              { value: "12", label: "Décembre" },
            ]}
          />
        </div>

        <div className="w-[calc(50%-6px)] sm:w-auto sm:min-w-[200px]">
          <GlassSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: t.allCautionStatuses },
              { value: "CREATION", label: "{t.inCreation}" },
              { value: "CHEZ_CLIENT", label: "{t.atClient}" },
              { value: "RETOURNEE", label: t.statusReturned },
              { value: "MAIN_LEVEE", label: t.statusReleased },
            ]}
          />
        </div>
      </div>

      {/* Cautions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden p-0 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <SortableHeader label={t.colCautionNum} field="numero" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label={t.colClient} field="client_nom" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label={t.colTypeObjet} field="type" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label={t.colMontant} field="montant" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label={t.colStatut} field="statut" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-end whitespace-nowrap">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : cautions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      title={t.noCautions}
                      message={t.noCautionsDesc}
                      icon={ShieldCheck}
                    />
                  </td>
                </tr>
              ) : (
                (() => {
                  const groupedCautions = cautions.reduce((acc, c) => {
                    const year = c.date_emission ? c.date_emission.substring(0, 4) : "Sans date";
                    if (!acc[year]) acc[year] = [];
                    acc[year].push(c);
                    return acc;
                  }, {} as Record<string, Caution[]>);
                  
                  const sortedYears = Object.keys(groupedCautions).sort((a, b) => b.localeCompare(a));

                  return (
                    <>
                      {sortedYears.map((year) => (
                        <React.Fragment key={year}>
                          <tr className="bg-white/[0.03]">
                            <td colSpan={6} className="py-2 px-5 border-y border-white/5">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-white/40" />
                                <span className="text-xs font-heading font-bold text-white/70 tracking-wider">{t.yearPrefix} {year}</span>
                              </div>
                            </td>
                          </tr>
                          {groupedCautions[year].map((c) => {
                            const isDemande = c.type === "DEMANDE";
                  const isBonneExec = c.type === "BONNE_EXECUTION";
                  const isCreation = c.statut === "CREATION";
                  const isChezClient = c.statut === "CHEZ_CLIENT";
                  const isRetournee = c.statut === "RETOURNEE" || c.statut === "MAIN_LEVEE";

                  return (
                    <tr
                      key={c.id}
                      className="group hover:bg-white/[0.02] transition-colors relative cursor-pointer"
                    >
                      <td className="py-4 px-5">
                        <Link href={`/cautions/${c.id}`} className="block before:absolute before:inset-0 before:z-10">
                          <span className="font-mono text-[11px] font-bold text-[var(--color-electric-violet)] block mb-0.5 group-hover:underline">
                            {c.numero}
                          </span>
                        </Link>
                        <span className="text-[10px] text-white/40 font-mono">
                          {c.banque_emetteur}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-xs font-bold text-white">
                          {c.client_nom || "Client"}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 font-mono">
                          Réf: {c.contrat_reference || c.reference_numero || "—"}
                        </p>
                      </td>
                      <td className="py-4 px-5 max-w-[200px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 border ${
                            isDemande
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              : isBonneExec
                              ? "bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border-[var(--color-electric-violet)]/20"
                              : "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                          }`}
                        >
                          {isDemande ? t.typeDemande : isBonneExec ? t.typeBonneExec : t.typeSoumission}
                        </span>
                        <p className="text-xs text-white/60 truncate" title={c.objet}>
                          {c.objet}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs font-bold text-white block">
                          {c.montant.toLocaleString("fr-FR")} {c.devise}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            isChezClient
                              ? "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                              : isRetournee
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              : "bg-white/5 text-white/50 border-white/10"
                          }`}
                        >
                          {isChezClient
                            ? "{t.atClient}"
                            : isRetournee
                            ? "Récupéré"
                            : "Création"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-end relative z-20">
                        <div className="flex items-center justify-end gap-2">
                          {/* Workflow actions */}
                          {isCreation && (
                            <button
                              onClick={() => setUploadModal({ isOpen: true, caution: c, step: "ORIGINALE" })}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-turbo)]/30 bg-[var(--color-turbo)]/10 px-3 py-1.5 text-xs text-[var(--color-turbo)] font-medium hover:bg-[var(--color-turbo)]/20 transition-colors shadow-sm whitespace-nowrap"
                              title="Téléverser la caution originale de la banque"
                            >
                              <Upload className="h-3 w-3" /> {t.btnOriginal}
                            </button>
                          )}
                          {isChezClient && (
                            <button
                              onClick={() => setUploadModal({ isOpen: true, caution: c, step: "PREUVE" })}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors shadow-sm whitespace-nowrap"
                              title="Téléverser la preuve client"
                            >
                              <Upload className="h-3 w-3" /> {t.btnClientProof}
                            </button>
                          )}

                          {/* PDF */}
                          {c.url_caution_pdf && (
                            <a
                              href={c.url_caution_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white font-medium hover:bg-white/10 transition-colors shadow-sm"
                            >
                              <Download className="h-3.5 w-3.5" /> PDF
                            </a>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClick(c.id, c.numero)}
                            className="p-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shadow-sm"
                            title={t.archiveCaution}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </>
        );
      })()
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
        <NouvelleDemandeModal
          isOpen={isDemandeModalOpen}
          onClose={() => setIsDemandeModalOpen(false)}
          onSuccess={() => fetchCautions()}
        />

        {uploadModal.caution && (
          <UploadCautionModal
            isOpen={uploadModal.isOpen}
            onClose={() => setUploadModal({ isOpen: false, caution: null, step: "ORIGINALE" })}
            onSuccess={() => fetchCautions()}
            caution={uploadModal.caution}
            step={uploadModal.step}
          />
        )}

        <GlassConfirmModal
          isOpen={confirmModal.isOpen}
          onCancel={() => setConfirmModal({ isOpen: false, cautionId: null, cautionNum: "", isLoading: false })}
          onConfirm={handleDeleteConfirm}
          title={t.archiveCaution}
          message={`Êtes-vous sûr de vouloir archiver la caution ${confirmModal.cautionNum} ? Cette action la masquera des listes actives.`}
          confirmText="Archiver"
          cancelText="Annuler"
          isLoading={confirmModal.isLoading}
          type="danger"
        />
      </Portal>
    </div>
  );
}
