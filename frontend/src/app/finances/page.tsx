"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  DollarSign,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  RefreshCw,
  Ban,
} from "lucide-react";
import { api } from "@/lib/api";
import { Facture, FactureListResponse } from "@/types/finance";
import { AddFactureModal } from "@/components/modules/finances/AddFactureModal";
import { EncaisserModal } from "@/components/modules/finances/AddPaiementModal";
import { Portal } from "@/components/shared/Portal";
import { AccessDeniedCard } from "@/components/shared/AccessDeniedCard";
import { useAuthStore } from "@/stores/authStore";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";

const STATUT_CONFIG: Record<string, { label: string; color: string; border: string; icon: any }> = {
  EN_ATTENTE: { label: "En attente", color: "text-yellow-400", border: "border-yellow-500/20", icon: Clock },
  PAYEE: { label: "Payée", color: "text-emerald-400", border: "border-emerald-500/20", icon: CheckCircle2 },
  EN_RETARD: { label: "En retard", color: "text-orange-400", border: "border-orange-500/20", icon: AlertCircle },
  ANNULEE: { label: "Annulée", color: "text-red-400", border: "border-red-500/20", icon: Ban },
};

export default function FinancesPage() {
  const { hasPermission, setDeniedAction } = useAuthStore();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [kpis, setKpis] = useState({ total_montant: 0, total_encaisse: 0, total_en_attente: 0 });

  const [factureModalOpen, setFactureModalOpen] = useState(false);
  const [encaisserModalOpen, setEncaisserModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);

  const canView = hasPermission("view_facture");
  const canCreate = hasPermission("create_facture");
  const canPay = hasPermission("record_paiement");

  const fetchFactures = useCallback(async () => {
    if (!canView) {
      setIsForbidden(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsForbidden(false);
    setErrorMessage(null);

    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;

      const res = await api.get<FactureListResponse>("/factures", params);
      if (res.data) {
        setFactures(res.data.items || []);
        setKpis({
          total_montant: res.data.total_montant || 0,
          total_encaisse: res.data.total_encaisse || 0,
          total_en_attente: res.data.total_en_attente || 0,
        });
      }
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (err: any) {
      if (err.status === 403) {
        setIsForbidden(true);
        setErrorMessage(err.detail || "Accès refusé.");
      } else {
        setErrorMessage(err.detail || "Erreur de chargement.");
      }
    } finally {
      setLoading(false);
    }
  }, [canView, search]);

  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleEncaisser = (facture: Facture) => {
    if (!canPay) {
      setDeniedAction("record_paiement");
      return;
    }
    setSelectedFacture(facture);
    setEncaisserModalOpen(true);
  };

  if (isForbidden || !canView) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        <AccessDeniedCard />
      </div>
    );
  }

  const totalPages = Math.ceil(factures.length / ITEMS_PER_PAGE);
  const paginatedFactures = factures.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden animate-in fade-in duration-300 contain-layout">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-accent text-emerald-400 uppercase tracking-widest mb-1 font-bold flex items-center gap-2">
            <DollarSign className="w-3 h-3" /> Module Facturation
          </span>
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight drop-shadow-md">Factures</h1>
          <p className="text-sm text-white/60 mt-1 max-w-xl">
            Suivi des factures clients, statuts de paiement et encaissements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchFactures()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl glass-panel border-white/10 hover:bg-white/10 text-white transition-all"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              if (!canCreate) {
                setDeniedAction("create_facture");
              } else {
                setFactureModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Facture
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Montant Total Factures</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpis.total_montant.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-white/40 font-bold">DZD</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <DollarSign className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Total Encaissé</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-emerald-400">{kpis.total_encaisse.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-emerald-400/60 font-bold">DZD</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">En Attente de Paiement</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-yellow-400">{kpis.total_en_attente.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-yellow-400/60 font-bold">DZD</span>
            </div>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/20 group-hover:border-yellow-500/40 transition-colors">
            <Clock className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une facture..."
            className="w-full !pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-[var(--color-haiti)] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : factures.length === 0 ? (
        <EmptyState
          title="Aucune facture"
          message="Créez votre première facture pour commencer le suivi."
          icon={Receipt}
        />
      ) : (
        <div className="glass-panel overflow-hidden p-0">
          <div className="overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/20 border-b border-white/10 text-white/40 font-accent uppercase tracking-widest">
                <tr>
                  <th className="py-3 px-4 w-[13%]">N° Facture</th>
                  <th className="py-3 px-4 w-[17%]">Client</th>
                  <th className="py-3 px-4 w-[10%]">Date</th>
                  <th className="py-3 px-4 w-[11%]">Mois Réalis.</th>
                  <th className="py-3 px-4 text-right w-[13%]">Montant</th>
                  <th className="py-3 px-4 text-center w-[10%]">Statut</th>
                  <th className="py-3 px-4 text-center w-[12%]">Mode Règl.</th>
                  <th className="py-3 px-4 text-center w-[8%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedFactures.map((f) => {
                  const statutCfg = STATUT_CONFIG[f.statut] || STATUT_CONFIG.EN_ATTENTE;
                  const StatutIcon = statutCfg.icon;
                  return (
                    <tr key={f.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-white/80">{f.numero}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 text-white/30 shrink-0" />
                          <span className="font-medium text-white truncate">{f.client_nom || "Client"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white/60 font-mono">{f.date_facture}</td>
                      <td className="py-3 px-4 text-white/60">{f.mois_realisation}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {f.montant_facture.toLocaleString("fr-FR")} <span className="text-[9px] font-sans text-white/40">DZD</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border font-accent uppercase tracking-wider text-[9px] font-bold ${statutCfg.color} ${statutCfg.border} bg-black/20`}>
                          <StatutIcon className="h-3 w-3" />
                          {statutCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] text-white/50 font-medium">
                          {f.mode_reglement || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canPay && f.statut === "EN_ATTENTE" && (
                            <button
                              onClick={() => handleEncaisser(f)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 transition-all text-[9px] font-bold font-accent uppercase tracking-wider"
                              title="Encaisser"
                            >
                              <CreditCard className="h-3 w-3" /> Encaisser
                            </button>
                          )}
                          {f.url_document_reglement && (
                            <a
                              href={f.url_document_reglement}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                              title="Document justificatif"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <GlassPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={factures.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals */}
      <Portal>
        <AddFactureModal
          isOpen={factureModalOpen}
          onClose={() => setFactureModalOpen(false)}
          onSuccess={fetchFactures}
        />
        <EncaisserModal
          facture={selectedFacture}
          isOpen={encaisserModalOpen}
          onClose={() => {
            setEncaisserModalOpen(false);
            setSelectedFacture(null);
          }}
          onSuccess={fetchFactures}
        />
      </Portal>
    </div>
  );
}
