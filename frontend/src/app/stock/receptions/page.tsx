"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  Search,
  Download,
  Calendar,
  Package,
  RefreshCw,
  Eye,
  X,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { Reception, ReceptionDetail, ReceptionListResponse } from "@/types/stock";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Portal } from "@/components/shared/Portal";
import { GlassSelect } from "@/components/ui/GlassSelect";

const MODE_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  CHEQUE: "Chèque",
  VIREMENT: "Virement",
  CREDIT: "Crédit",
  CCP: "CCP",
};

export default function ReceptionHistoryPage() {
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [detailReception, setDetailReception] = useState<ReceptionDetail | null>(null);

  const fetchReceptions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (yearFilter) params.annee = yearFilter;
      if (monthFilter) params.mois = monthFilter;
      params.page = page.toString();
      params.per_page = "15";

      const res = await api.get<ReceptionListResponse>("/stock/receptions", params);
      setReceptions(res.data.items);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching receptions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, yearFilter, monthFilter, page]);

  useEffect(() => { setPage(1); }, [search, yearFilter, monthFilter]);
  useEffect(() => { fetchReceptions(); }, [fetchReceptions]);

  const openDetail = async (id: string) => {
    try {
      const res = await api.get<ReceptionDetail>(`/stock/receptions/${id}`);
      setDetailReception(res.data);
    } catch (err) {
      console.error("Error fetching detail:", err);
    }
  };

  const generateBonAchat = async (id: string) => {
    try {
      const res = await api.post<ReceptionDetail>(`/stock/receptions/${id}/generate-pdf-achat`, {});
      setReceptions((prev) => prev.map((r) => r.id === id ? { ...r, url_pdf: res.data.url_pdf } : r));
      if (detailReception && detailReception.id === id) {
        setDetailReception((prev) => prev ? { ...prev, url_pdf: res.data.url_pdf } : prev);
      }
      if (res.data.url_pdf) {
        window.open(res.data.url_pdf, "_blank");
      }
    } catch (err) {
      console.error("Error generating bon achat:", err);
      alert("Erreur lors de la génération du Bon d'Achat");
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <div className="flex items-center gap-3">
          <Link
            href="/stock"
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] font-accent uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Historique
            </p>
            <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-md">
              Historique des Réceptions
            </h1>
            <p className="text-sm text-white/60 mt-1 font-sans max-w-xl">
              Toutes les réceptions fournisseurs enregistrées
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReceptions}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10 group"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-400 transition-transform ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
            Actualiser
          </button>
          <Link
            href="/stock"
            className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/30"
          >
            <ArrowDownRight className="h-4 w-4" />
            Nouvelle Réception
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="relative z-20 flex flex-wrap gap-3 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: "0.1s" }}>
        <div className="relative w-full lg:w-auto lg:flex-1 min-w-[250px] group">
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40 group-focus-within:text-emerald-400 transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par N°, fournisseur, référence document..."
            className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all font-medium"
          />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-auto sm:min-w-[150px]">
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
        </div>
        <div className="w-[calc(50%-6px)] sm:w-auto sm:min-w-[150px]">
          <GlassSelect
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Mois"
            options={[
              { value: "", label: "Tous les mois" },
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
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden p-0 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: "0.2s" }}>
        <div className="w-full min-w-0">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">N° Réception</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Date</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Fournisseur</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Réf. Doc</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Mode Règlement</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-end whitespace-nowrap">Montant Total</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-end whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={8} />
                  </td>
                </tr>
              ) : receptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      title="Aucune réception"
                      message="Aucune réception fournisseur n'a été enregistrée."
                      icon={Package}
                    />
                  </td>
                </tr>
              ) : (
                receptions.map((r) => (
                  <tr key={r.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-mono text-[11px] font-bold text-emerald-400">{r.numero}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-white/70 font-mono">
                        {new Date(r.date).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-white/80">{r.fournisseur_nom || "—"}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-white/60 font-mono text-[10px]">{r.reference_document || "—"}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white/70">
                        {MODE_LABELS[r.mode_reglement] || r.mode_reglement}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-end">
                      <span className="font-mono text-sm font-extrabold text-white">
                        {r.montant_total.toLocaleString("fr-FR")} <span className="text-[10px] text-white/40 font-normal">DA</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => generateBonAchat(r.id)}
                          className="flex items-center gap-1.5 p-1.5 px-3 rounded-xl border border-[var(--color-electric-violet)]/20 bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)]/20 transition-colors text-xs font-bold"
                          title="Générer Bon d'Achat"
                        >
                          <FileText className="h-3.5 w-3.5" /> Bon
                        </button>
                        <button
                          onClick={() => openDetail(r.id)}
                          className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                          title="Détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {r.url_pdf && (
                          <a
                            href={r.url_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl border border-[var(--color-electric-violet)]/20 bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)]/20 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Detail Modal */}
      {detailReception && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[85vh] flex flex-col">
              <div className="absolute top-0 end-0 w-48 h-48 blur-[80px] pointer-events-none rounded-full bg-emerald-500/10" />

              <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-white">Détail Réception</h2>
                  <p className="text-xs text-white/50 mt-0.5 font-mono">{detailReception.numero}</p>
                </div>
                <button onClick={() => setDetailReception(null)} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto relative z-10 flex-1 custom-scrollbar space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Date</p>
                    <p className="text-white font-mono mt-1">{new Date(detailReception.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Fournisseur</p>
                    <p className="text-white font-medium mt-1">{detailReception.fournisseur_nom || "—"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Mode Règlement</p>
                    <p className="text-white mt-1">{MODE_LABELS[detailReception.mode_reglement] || detailReception.mode_reglement}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Réf. Document</p>
                    <p className="text-white font-mono mt-1">{detailReception.reference_document || "—"}</p>
                  </div>
                </div>

                {/* Lignes */}
                <div>
                  <p className="text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold mb-2">Articles</p>
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02]">
                          <th className="py-2 px-3 text-start text-[10px] text-white/50 font-bold">Réf.</th>
                          <th className="py-2 px-3 text-start text-[10px] text-white/50 font-bold">Désignation</th>
                          <th className="py-2 px-3 text-center text-[10px] text-white/50 font-bold">Qté</th>
                          <th className="py-2 px-3 text-end text-[10px] text-white/50 font-bold">P.U.</th>
                          <th className="py-2 px-3 text-end text-[10px] text-white/50 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {detailReception.lignes.map((l) => (
                          <tr key={l.id}>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-400">{l.piece_reference}</td>
                            <td className="py-2 px-3 text-white/80">{l.piece_designation}</td>
                            <td className="py-2 px-3 text-center text-white/70">{l.quantite}</td>
                            <td className="py-2 px-3 text-end text-white/70 font-mono">{l.prix_unitaire.toLocaleString("fr-FR")} DA</td>
                            <td className="py-2 px-3 text-end font-mono font-bold text-white">{l.montant_ligne.toLocaleString("fr-FR")} DA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="px-6 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Montant Total</p>
                    <p className="text-lg font-heading font-extrabold text-emerald-400 font-mono">
                      {detailReception.montant_total.toLocaleString("fr-FR")} DA
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => generateBonAchat(detailReception.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)]/10 border border-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)]/20 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" /> Générer Bon
                </button>
                {detailReception.url_pdf && (
                  <a
                    href={detailReception.url_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#6c3ce0] transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> Télécharger
                  </a>
                )}
                <button
                  onClick={() => setDetailReception(null)}
                  className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
