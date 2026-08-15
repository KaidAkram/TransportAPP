"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  FileText,
  DollarSign,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { Devis, Facture, DevisListResponse, FactureListResponse } from "@/types/finance";
import { STATUS_COLOR_MAP } from "@/lib/constants";
import { AddDevisModal } from "@/components/modules/finances/AddDevisModal";
import { AddFactureModal } from "@/components/modules/finances/AddFactureModal";
import { AddPaiementModal } from "@/components/modules/finances/AddPaiementModal";
import { Portal } from "@/components/shared/Portal";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { AccessDeniedCard } from "@/components/shared/AccessDeniedCard";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { GlassPagination } from "@/components/ui/GlassPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";

export default function FinancesPage() {
  const { hasPermission, setDeniedAction } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"factures" | "devis">("factures");
  const [factures, setFactures] = useState<Facture[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [kpis, setKpis] = useState({
    totalCA: 0,
    totalEncaisse: 0,
    totalCreances: 0,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  // Modal States
  const [devisModalOpen, setDevisModalOpen] = useState(false);
  const [factureModalOpen, setFactureModalOpen] = useState(false);
  const [paiementModalOpen, setPaiementModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    devisId: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    devisId: null,
    isLoading: false,
  });

  const canViewFactures = hasPermission("view_facture");
  const canViewDevis = hasPermission("view_devis");
  const canCreateDevis = hasPermission("create_devis");
  const canCreateFacture = hasPermission("create_facture");
  const canConvert = hasPermission("convert_devis_to_contrat");
  const canPay = hasPermission("record_paiement");

  const currentCanView = activeTab === "factures" ? canViewFactures : canViewDevis;

  const fetchFinances = useCallback(async () => {
    if (!currentCanView) {
      setIsForbidden(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsForbidden(false);
    setErrorMessage(null);

    try {
      if (activeTab === "factures") {
        const res = await api.get<FactureListResponse>(`/factures${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        if (res.data) {
          setFactures(res.data.items || []);
          setKpis({
            totalCA: res.data.total_chiffre_affaires || 0,
            totalEncaisse: res.data.total_encaisse || 0,
            totalCreances: res.data.total_creances || 0,
          });
        }
      } else {
        const res = await api.get<DevisListResponse>(`/devis${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        if (res.data) {
          setDevis(res.data.items || []);
        }
      }
      // Artificial delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (err: any) {
      if (err.status === 403) {
        setIsForbidden(true);
        setErrorMessage(err.detail || "Accès refusé : la consultation de cette section financière a été désactivée par l'administrateur.");
      } else {
        setErrorMessage(err.detail || "Erreur de chargement des données financières.");
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, currentCanView]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const handleConvertDevisClick = (devisId: string) => {
    if (!canConvert) {
      setDeniedAction("convert_devis_to_contrat");
      return;
    }
    setConfirmModal({ isOpen: true, devisId, isLoading: false });
  };

  const executeConvertDevis = async () => {
    if (!confirmModal.devisId) return;
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await api.post(`/devis/${confirmModal.devisId}/convertir-contrat`, {});
      if (res.data) {
        fetchFinances();
        setConfirmModal({ isOpen: false, devisId: null, isLoading: false });
      }
    } catch (err: any) {
      alert(err.detail || err.message || "Erreur de conversion");
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleOpenPaiement = (facture: Facture) => {
    if (!canPay) {
      setDeniedAction("record_paiement");
      return;
    }
    setSelectedFacture(facture);
    setPaiementModalOpen(true);
  };

  if (isForbidden || !currentCanView) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        <AccessDeniedCard />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden animate-in fade-in duration-300 contain-layout">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-accent text-[var(--color-electric-violet)] uppercase tracking-widest mb-1 font-bold flex items-center gap-2">
            <DollarSign className="w-3 h-3" /> Module Finances
          </span>
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight drop-shadow-md">Facturation & Devis</h1>
          <p className="text-sm text-white/60 mt-1 max-w-xl">
            Gestion du cycle de vente, devis certifiés, émission de factures et balance des règlements clients
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!canCreateDevis) {
                setDeniedAction("create_devis");
              } else {
                setDevisModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl glass-panel border-white/10 hover:bg-white/10 text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            <FileText className="h-4 w-4 text-white/70" />
            Nouveau Devis
          </button>
          
          <button
            onClick={() => {
              if (!canCreateFacture) {
                setDeniedAction("create_facture");
              } else {
                setFactureModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-[var(--color-electric-violet)] text-white hover:bg-[#6c3ce0] transition-colors shadow-[0_0_15px_rgba(131,77,251,0.4)] hover:shadow-[0_0_25px_rgba(131,77,251,0.6)]"
          >
            <Plus className="h-4 w-4" />
            Émettre Facture
          </button>
        </div>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Chiffre d'Affaires Global (TTC)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpis.totalCA.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-white/40 font-bold">DZD</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <DollarSign className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Total Encaissé (Règlements)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpis.totalEncaisse.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-emerald-400 font-bold">DZD</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1">Créances Clients (Reste Dû)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-extrabold text-white">{kpis.totalCreances.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-rose-400 font-bold">DZD</span>
            </div>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20 group-hover:border-rose-500/40 transition-colors">
            <Clock className="h-5 w-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("factures")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "factures"
                ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_10px_rgba(131,77,251,0.2)]"
                : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
          >
            <Receipt className="h-4 w-4" />Facturation & Règlements ({factures.length})
          </button>
          <button
            onClick={() => setActiveTab("devis")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "devis"
                ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_10px_rgba(131,77,251,0.2)]"
                : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
          >
            <FileText className="h-4 w-4" />Devis Commerciaux ({devis.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher ${activeTab === "factures" ? "une facture" : "un devis"}...`}
            className="w-full !pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[var(--color-haiti)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          />
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : activeTab === "factures" ? (
        factures.length === 0 ? (
          <EmptyState 
            title="Aucune facture" 
            message="Créez votre première facture pour initier le suivi financier." 
            icon={Receipt} 
          />
        ) : (
          <div className="glass-panel overflow-hidden p-0">
            <div className="overflow-hidden">
              <table className="w-full text-left text-xs table-fixed">
                <thead className="bg-black/20 border-b border-white/10 text-white/40 font-accent uppercase tracking-widest">
                  <tr>
                    <th className="py-3 px-3 w-[13%]">N° Facture</th>
                    <th className="py-3 px-3 w-[17%]">Client Facturé</th>
                    <th className="py-3 px-3 w-[14%]">Émission / Échéance</th>
                    <th className="py-3 px-3 text-right w-[12%]">Total TTC</th>
                    <th className="py-3 px-3 text-right w-[12%]">Encaissé</th>
                    <th className="py-3 px-3 text-right w-[12%]">Reste Dû</th>
                    <th className="py-3 px-3 text-center w-[10%]">Statut</th>
                    <th className="py-3 px-3 text-center w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {factures.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((f) => {
                    const isEnAttente = f.montant_restant > 0;
                    return (
                      <tr key={f.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-3 px-3 text-xs font-mono font-bold truncate">
                          <Link href={`/finances/factures/${f.id}`} className="text-white/80 hover:text-[var(--color-electric-violet)] transition-colors underline-offset-4 hover:underline">
                            {f.numero}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-white truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="h-3.5 w-3.5 text-white/30 shrink-0" />
                            <span className="truncate">{f.client_nom || "Client"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-white/60 truncate">
                          <div className="text-white/90">{f.date_emission}</div>
                          <div className="text-[9px] font-accent tracking-widest text-[var(--color-turbo)] mt-0.5">ÉCH: {f.date_echeance}</div>
                        </td>
                        <td className="py-3 px-3 text-right text-xs font-mono font-bold text-white truncate">
                          {f.total_ttc.toLocaleString("fr-FR")} <span className="text-[9px] font-sans text-white/40">DZD</span>
                        </td>
                        <td className="py-3 px-3 text-right text-xs font-mono text-white/80 truncate">
                          {f.montant_paye.toLocaleString("fr-FR")} <span className="text-[9px] font-sans text-white/40">DZD</span>
                        </td>
                        <td className="py-3 px-3 text-right text-xs font-mono font-bold text-white truncate">
                          {f.montant_restant.toLocaleString("fr-FR")} <span className="text-[9px] font-sans text-white/40">DZD</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded border font-accent uppercase tracking-wider text-[8px] font-bold truncate ${
                            f.statut === "PAYE" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : isEnAttente 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : "bg-white/5 text-white/60 border-white/10"
                          }`}>
                            {f.statut}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canPay && f.montant_restant > 0 && (
                              <button
                                onClick={() => handleOpenPaiement(f)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 transition-all text-[9px] font-bold font-accent uppercase tracking-wider"
                                title="Enregistrer un versement"
                              >
                                <CreditCard className="h-3 w-3" /> Encaisser
                              </button>
                            )}
                            {f.url_pdf && (
                              <a
                                href={f.url_pdf}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                                title="Télécharger le PDF"
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
            {/* Pagination Controls - Factures */}
            <GlassPagination 
              currentPage={currentPage}
              totalPages={Math.ceil(factures.length / ITEMS_PER_PAGE)}
              totalItems={factures.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )
      ) : devis.length === 0 ? (
        <EmptyState 
          title="Aucun devis commercial" 
          message="Établissez une proposition commerciale pour un client prospect ou partenaire." 
          icon={FileText} 
        />
      ) : (
        <div className="glass-panel overflow-hidden p-0">
          <div className="overflow-hidden">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-black/20 border-b border-white/10 text-white/40 font-accent uppercase tracking-widest">
                <tr>
                  <th className="py-3 px-3 w-[13%]">N° Devis</th>
                  <th className="py-3 px-3 w-[16%]">Client Destinataire</th>
                  <th className="py-3 px-3 w-[18%]">Objet de la Prestation</th>
                  <th className="py-3 px-3 w-[13%]">Validité</th>
                  <th className="py-3 px-3 text-right w-[11%]">Total HT</th>
                  <th className="py-3 px-3 text-right w-[11%]">Total TTC</th>
                  <th className="py-3 px-3 text-center w-[9%]">Statut</th>
                  <th className="py-3 px-3 text-center w-[9%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {devis.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((d) => {
                  return (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-3 text-xs font-mono font-bold truncate">
                        <Link href={`/finances/devis/${d.id}`} className="text-white/80 hover:text-[var(--color-turbo)] transition-colors underline-offset-4 hover:underline">
                          {d.numero}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-xs font-medium text-white truncate">
                        {d.client_nom || "Client"}
                      </td>
                      <td className="py-3 px-3 text-xs text-white/60 font-medium truncate">
                        {d.objet}
                      </td>
                      <td className="py-3 px-3 text-xs text-[var(--color-turbo)]/80 truncate">
                        Jusqu'au {d.date_validite}
                      </td>
                      <td className="py-3 px-3 text-xs text-right font-mono text-white/50 truncate">
                        {d.total_ht.toLocaleString("fr-FR")} <span className="text-[9px] font-sans">DZD</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-right font-mono font-bold text-white truncate">
                        {d.total_ttc.toLocaleString("fr-FR")} <span className="text-[9px] font-sans text-white/40">DZD</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded border font-accent uppercase tracking-wider text-[8px] font-bold truncate ${
                          d.statut === "ACCEPTE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : d.statut === "REFUSE" || d.statut === "EXPIRE"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] border-[var(--color-turbo)]/20"
                        }`}>
                          {d.statut}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canConvert && !d.contrat_id ? (
                            <button
                              onClick={() => handleConvertDevisClick(d.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] hover:bg-[var(--color-turbo)]/20 hover:text-[#ffe133] border border-[var(--color-turbo)]/20 transition-all text-[9px] font-bold font-accent uppercase tracking-wider"
                              title="Convertir en contrat actif"
                            >
                              <FileCheck className="h-3 w-3" /> Convertir
                            </button>
                          ) : (
                            d.contrat_id && (
                              <span className="text-[8px] font-accent uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Lié
                              </span>
                            )
                          )}
                          {d.url_pdf && (
                            <a
                              href={d.url_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                              title="Télécharger le PDF du Devis"
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
            totalPages={Math.ceil(devis.length / ITEMS_PER_PAGE)}
            totalItems={devis.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals */}
      <Portal>
        <AddDevisModal
          isOpen={devisModalOpen}
          onClose={() => setDevisModalOpen(false)}
          onSuccess={fetchFinances}
        />
        <AddFactureModal
          isOpen={factureModalOpen}
          onClose={() => setFactureModalOpen(false)}
          onSuccess={fetchFinances}
        />
        <AddPaiementModal
          facture={selectedFacture}
          isOpen={paiementModalOpen}
          onClose={() => {
            setPaiementModalOpen(false);
            setSelectedFacture(null);
          }}
          onSuccess={fetchFinances}
        />
        <GlassConfirmModal
          isOpen={confirmModal.isOpen}
          title="Conversion en Contrat"
          message="Voulez-vous convertir ce devis accepté en contrat d'exploitation actif ? Cette action créera automatiquement un contrat associé à ce client."
          confirmText="Convertir"
          cancelText="Annuler"
          type="info"
          onConfirm={executeConvertDevis}
          onCancel={() => setConfirmModal({ isOpen: false, devisId: null, isLoading: false })}
          isLoading={confirmModal.isLoading}
        />
      </Portal>
    </div>
  );
}
