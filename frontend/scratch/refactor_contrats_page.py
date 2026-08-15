import sys

file_path = "c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/contrats/page.tsx"

content = """"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Factory,
} from "lucide-react";
import { AddContractModal } from "@/components/modules/contrats/AddContractModal";
import { api } from "@/lib/api";
import { Contrat, ContratListResponse } from "@/types/contrat";

export default function ContratsPage() {
  const [contracts, setContracts] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.statut = statusFilter;
      if (typeFilter) params.type_contrat = typeFilter;

      const res = await api.get<ContratListResponse>("/contrats", params);
      setContracts(res.data.items);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleDelete = async (id: string, ref: string) => {
    // using window.confirm is not ideal in glassmorphism but keeping logic
    if (confirm(`Confirmez-vous l'archivage du contrat ${ref} ?`)) {
      try {
        await api.delete(`/contrats/${id}`);
        fetchContracts();
      } catch (err) {
        alert("Erreur lors de l'archivage du contrat.");
      }
    }
  };

  // KPI Calculations
  const totalCount = contracts.length;
  const actifsCount = contracts.filter((c) => c.statut === "ACTIF").length;
  const expirantBientotCount = contracts.filter(
    (c) => c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants >= 0 && c.jours_restants <= 30
  ).length;
  const totalVolumeDZD = contracts.reduce((acc, c) => acc + (c.montant || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <FileText className="w-3 h-3" />
            Suivi Contractuel
          </p>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-white drop-shadow-md">
            Gestion des Contrats & Conventions
          </h1>
          <p className="text-sm text-white/60 mt-1 font-sans">
            Suivi des accords commerciaux, avenants d'extension et alertes d'échéances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchContracts}
            className="flex items-center px-4 py-2 rounded-xl text-xs font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[var(--color-electric-violet)]/90 hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] transition-all"
          >
            <Plus className="h-4 w-4" />
            Nouveau Contrat
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group rounded-2xl">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Total Conventions</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-extrabold text-white">{totalCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">Accords contractuels enregistrés</p>
          </div>
          <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
            <FileText className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="glass-panel px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group rounded-2xl">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Contrats Actifs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-extrabold text-emerald-400">{actifsCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">En cours d'exécution</p>
          </div>
          <div className="p-3 bg-emerald-400/10 rounded-full border border-emerald-400/20 group-hover:bg-emerald-400/20 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group rounded-2xl">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Échéance &le; 30 jours</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-extrabold text-[var(--color-turbo)]">{expirantBientotCount}</span>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">À renouveler rapidement</p>
          </div>
          <div className="p-3 bg-[var(--color-turbo)]/10 rounded-full border border-[var(--color-turbo)]/20 group-hover:bg-[var(--color-turbo)]/20 transition-colors">
            <Clock className="h-5 w-5 text-[var(--color-turbo)]" />
          </div>
        </div>

        <div className="glass-panel px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group rounded-2xl">
          <div>
            <p className="text-[10px] font-accent uppercase text-white/50 tracking-widest mb-1 font-bold">Volume Financier Global</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-heading font-extrabold text-white truncate">{totalVolumeDZD.toLocaleString("fr-DZ")} DZD</span>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">Engagement financier total</p>
          </div>
          <div className="p-3 bg-[var(--color-electric-violet)]/10 rounded-full border border-[var(--color-electric-violet)]/20 group-hover:bg-[var(--color-electric-violet)]/20 transition-colors">
            <DollarSign className="h-5 w-5 text-[var(--color-electric-violet)]" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40 group-focus-within:text-[var(--color-electric-violet)] transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence, objet ou partenaire..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all shadow-inner font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all cursor-pointer appearance-none font-medium"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5rem' }}
          >
            <option value="" className="bg-[var(--color-haiti)] text-white">Tous les statuts</option>
            <option value="ACTIF" className="bg-[var(--color-haiti)] text-white">Contrats Actifs</option>
            <option value="EXPIRE" className="bg-[var(--color-haiti)] text-white">Contrats Expirés</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all cursor-pointer appearance-none font-medium"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5rem' }}
          >
            <option value="" className="bg-[var(--color-haiti)] text-white">Tous les types de contrat</option>
            <option value="Transport" className="bg-[var(--color-haiti)] text-white">Transport Régulier / Navettes</option>
            <option value="Tourisme" className="bg-[var(--color-haiti)] text-white">Circuits Touristiques</option>
            <option value="Location" className="bg-[var(--color-haiti)] text-white">Location d'Autocars</option>
            <option value="Fourniture" className="bg-[var(--color-haiti)] text-white">Fourniture de Pièces</option>
            <option value="Maintenance" className="bg-[var(--color-haiti)] text-white">Prestations de Maintenance</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-2xl overflow-hidden opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.3s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Réf. Contrat</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Partenaire</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Type & Objet</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Montant</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Période</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold whitespace-nowrap">Statut / Échéance</th>
                <th className="py-4 px-5 text-[10px] font-accent uppercase tracking-widest text-white/50 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-[var(--color-electric-violet)]" />
                    <p className="text-sm font-medium text-white/60">Chargement des contrats...</p>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white/80">Aucun contrat trouvé</p>
                    <p className="text-xs text-white/40 mt-1">Ajustez vos filtres ou ajoutez un nouveau contrat.</p>
                  </td>
                </tr>
              ) : (
                contracts.map((c) => {
                  const isClient = c.partenaire_role === "CLIENT";
                  const isUrgent = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants >= 0 && c.jours_restants <= 7;
                  const isWarning = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants > 7 && c.jours_restants <= 30;
                  const isExpired = c.jours_restants !== null && c.jours_restants !== undefined && c.jours_restants < 0;

                  return (
                    <tr
                      key={c.id}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-5">
                        <Link
                          href={`/contrats/${c.id}`}
                          className="font-mono text-[13px] font-bold text-[var(--color-electric-violet)] hover:text-[#9D75FF] transition-colors"
                        >
                          {c.reference}
                        </Link>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-white mb-0.5">{c.partenaire_nom || "Entreprise"}</span>
                          <span className={`inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[9px] font-accent uppercase tracking-widest font-bold ${
                            isClient ? "bg-white/10 text-white" : "bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)]"
                          }`}>
                            {isClient ? <Users className="h-2.5 w-2.5" /> : <Factory className="h-2.5 w-2.5" />}
                            {isClient ? "Client" : "Fournisseur"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-[13px] font-medium text-white truncate max-w-[200px]" title={c.objet}>
                          {c.objet}
                        </p>
                        <p className="text-[11px] text-white/50">{c.type_contrat}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-mono text-[13px] font-bold text-white">
                          {c.montant.toLocaleString("fr-DZ")} {c.devise}
                        </div>
                        {c.mode_facturation && (
                          <p className="text-[10px] text-white/50">{c.mode_facturation}</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-[11px] text-white/70 font-mono flex flex-col gap-0.5">
                          <span>{new Date(c.date_debut).toLocaleDateString("fr-FR")}</span>
                          <span className="text-white/30">&darr;</span>
                          <span>{new Date(c.date_fin).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.statut === "ACTIF"
                              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                              : "bg-white/5 text-white/50 border border-white/10"
                          }`}>
                            {c.statut}
                          </span>
                          
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400">
                              <AlertTriangle className="h-3 w-3" /> Expiré
                            </span>
                          ) : isUrgent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 animate-pulse">
                              <Clock className="h-3 w-3" /> {c.alerte_expiration}
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-turbo)]">
                              <Clock className="h-3 w-3" /> {c.alerte_expiration}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/50">
                              Valide ({c.jours_restants} j)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/contrats/${c.id}`}>
                            <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-[11px] font-bold text-white transition-all">
                              <Eye className="w-3.5 h-3.5" />
                              DOSSIER
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id, c.reference)}
                            className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
                            title="Archiver"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchContracts()}
      />
    </div>
  );
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Page Contrats rewritten successfully.")
