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
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddVehicleModal } from "@/components/modules/vehicules/AddVehicleModal";
import { api } from "@/lib/api";
import { Vehicule, VehiculeListResponse } from "@/types/vehicule";
import { Portal } from "@/components/shared/Portal";

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
  const enMission = vehicles.filter((v) => v.statut === "HORS_SERVICE").length;
  const maintenance = vehicles.filter((v) => v.statut === "MAINTENANCE" || v.statut === "IMMOBILISE").length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 font-sans contain-layout opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
      {/* Page Header */}
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div>
          <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] font-bold mb-1 ml-0.5 flex items-center gap-2">
            <Bus className="w-3 h-3" />
            Flotte
          </p>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-white drop-shadow-md flex items-center gap-2">
            Gestion du Parc Automobile
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            Supervision de la flotte, suivi kilométrique, conformité documentaire et maintenance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicles}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass-panel border-white/10 hover:bg-white/10 text-white transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#8A2BE2] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau Véhicule</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">Total Véhicules</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/70">
              <Bus className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-white drop-shadow-sm">{totalCount}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Flotte active sous gestion</p>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden group hover:border-[var(--color-turbo)]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(240,225,0,0.1)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-turbo)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-turbo)]/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">Disponibles</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-turbo)]/10 text-[var(--color-turbo)]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-[var(--color-turbo)] drop-shadow-sm">{disponibles}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Prêts pour affectation</p>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden group hover:border-[var(--color-electric-violet)]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(138,43,226,0.1)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-electric-violet)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-electric-violet)]/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">En Mission</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-[var(--color-electric-violet)] drop-shadow-sm">{enMission}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Sur route actuellement</p>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-accent uppercase tracking-widest text-white/50 font-bold">Maintenance / Arrêt</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-rose-400 drop-shadow-sm">{maintenance}</div>
            <p className="text-[10px] text-white/40 mt-1 font-accent tracking-wider uppercase">Atelier ou immobilisés</p>
          </div>
        </div>
      </div>

      {/* Fleet Data Table */}
      {/* Fleet Data Table */}
      <div className="opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.4s' }}>
        {loading ? (
          <div className="glass-panel overflow-hidden p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState 
            title="Aucun véhicule trouvé" 
            message="Ajustez vos filtres ou ajoutez un nouveau véhicule à la flotte." 
            icon={Bus} 
          />
        ) : (
          <div className="glass-panel overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead className="bg-black/20 border-b border-white/10 text-white/40 font-accent uppercase tracking-widest">
                  <tr>
                    <th className="py-3 px-4 w-[16%]">Immatriculation</th>
                    <th className="py-3 px-4 w-[20%]">Véhicule (Marque & Modèle)</th>
                    <th className="py-3 px-4 w-[12%]">Type</th>
                    <th className="py-3 px-4 w-[12%] text-center">Places</th>
                    <th className="py-3 px-4 w-[14%] text-right">Kilométrage</th>
                    <th className="py-3 px-4 w-[14%] text-center">Statut</th>
                    <th className="py-3 px-4 w-[12%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors group relative cursor-pointer">
                      <td className="py-3 px-4 text-xs font-mono font-bold text-white truncate">
                        <Link href={`/vehicules/${v.id}`} className="block group-hover:text-[var(--color-electric-violet)] transition-colors before:absolute before:inset-0 before:z-10">
                          {v.immatriculation}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-white truncate">
                        {v.marque} {v.modele}
                      </td>
                      <td className="py-3 px-4 text-xs text-white/60 truncate">
                        {v.type}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-white/80 truncate">
                        {v.nombre_places} pl.
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono text-white truncate">
                        {v.kilometrage_actuel.toLocaleString()} <span className="text-[9px] font-sans text-white/40">km</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={v.statut} />
                      </td>
                      <td className="py-3 px-4 text-right relative z-20">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/vehicules/${v.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/50 hover:text-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)]/10 transition-colors text-[10px] font-bold font-accent uppercase tracking-wider"
                            title="Voir la fiche"
                          >
                            <Eye className="h-3.5 w-3.5" /> Fiche
                          </Link>
                          {v.statut !== "HORS_SERVICE" && (
                            <button
                              onClick={() => handleArchive(v.id, v.immatriculation)}
                              className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Mettre hors service"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

            {/* Modals */}
      <Portal>
{/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchVehicles();
        }}
      />
      </Portal>
    </div>
  );
}
