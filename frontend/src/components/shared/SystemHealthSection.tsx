"use client";

import React, { useEffect, useState } from "react";
import { Server, Database, HardDrive, Cpu, Activity, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface SystemHealthData {
  database: {
    used_bytes: number;
    used_formatted: string;
    free_tier_limit_formatted: string;
    usage_percentage: number;
  };
  file_storage: {
    used_bytes: number;
    used_formatted: string;
    free_tier_limit_formatted: string;
    usage_percentage: number;
  };
  server: {
    disk_used_formatted: string;
    disk_total_formatted: string;
    memory_usage_mb: number;
  };
}

export function SystemHealthSection() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get<SystemHealthData>("/admin/system/storage-usage");
        setData(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to load system health data.");
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 animate-pulse mt-8 border-t-2 border-t-[var(--color-electric-violet)] rounded-2xl">
        <div className="h-6 w-48 bg-white/10 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-white/5 rounded-xl"></div>
          <div className="h-32 bg-white/5 rounded-xl"></div>
          <div className="h-32 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-6 mt-8 rounded-2xl border border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-sm font-bold">Erreur Système</h3>
        </div>
        <p className="text-xs text-red-300/80 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 mt-8 border-t-2 border-t-[var(--color-electric-violet)] rounded-2xl animate-[stagger-up_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      <h3 className="text-sm font-heading font-bold text-white mb-2 flex items-center gap-2">
        <Activity className="w-4 h-4 text-[var(--color-electric-violet)]" />
        Santé du Système & Stockage
      </h3>
      <p className="text-xs text-white/50 mb-6">
        Supervision de l'utilisation des ressources (Base de données, Fichiers, Serveur) pour éviter les dépassements de capacité.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Database Usage */}
        <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-electric-violet)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-electric-violet)]/20 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[var(--color-electric-violet)]/20 rounded-lg text-[var(--color-electric-violet)]">
              <Database className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Base de Données</h4>
          </div>
          
          <div className="flex justify-between text-[10px] font-accent uppercase tracking-widest text-white/50 mb-1">
            <span>Utilisé</span>
            <span>{data.database.usage_percentage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-3 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${data.database.usage_percentage > 80 ? 'bg-red-500' : data.database.usage_percentage > 50 ? 'bg-yellow-400' : 'bg-[var(--color-electric-violet)]'}`}
              style={{ width: `${Math.min(data.database.usage_percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-xl font-mono font-bold text-white">{data.database.used_formatted}</span>
            <span className="text-[10px] text-white/40">/ {data.database.free_tier_limit_formatted} max</span>
          </div>
        </div>

        {/* File Storage Usage */}
        <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <HardDrive className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Stockage Fichiers</h4>
          </div>
          
          <div className="flex justify-between text-[10px] font-accent uppercase tracking-widest text-white/50 mb-1">
            <span>Utilisé</span>
            <span>{data.file_storage.usage_percentage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-3 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${data.file_storage.usage_percentage > 80 ? 'bg-red-500' : data.file_storage.usage_percentage > 50 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(data.file_storage.usage_percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-xl font-mono font-bold text-white">{data.file_storage.used_formatted}</span>
            <span className="text-[10px] text-white/40">/ {data.file_storage.free_tier_limit_formatted} max</span>
          </div>
        </div>

        {/* Server Disk & RAM */}
        <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-turbo)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-turbo)]/20 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[var(--color-turbo)]/20 rounded-lg text-[var(--color-turbo)]">
              <Server className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Serveur / Conteneur</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3"/> Disque</span>
                <span>{data.server.disk_used_formatted} / {data.server.disk_total_formatted}</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3"/> Mémoire (RAM)</span>
                <span>{data.server.memory_usage_mb} MB (Processus)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
