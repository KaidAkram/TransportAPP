"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  FileText,
  Package,
  Shield,
  Wrench,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  X,
  Briefcase,
  Banknote,
  ShieldAlert,
  CheckSquare,
  IdCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { AlertItem, AlertsResponse } from "@/types/dashboard";
import { useAlertStore } from "@/stores/alertStore";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<(AlertItem & { read?: boolean })[]>([]);
  const [urgentCount, setUrgentCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { setAlerts: setStoreAlerts } = useAlertStore();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [res] = await Promise.all([
        api.get<AlertsResponse>("/alertes"),
        new Promise(resolve => setTimeout(resolve, 800)) // Ensures animation is visible for at least 0.8s
      ]);
      setAlerts(res.data.items.map(a => ({ ...a, read: false })));
      setUrgentCount(res.data.urgent_count);
      setWarningCount(res.data.warning_count);

      // Sync with global alert store
      setStoreAlerts(
        res.data.items.map((a) => ({
          id: a.id,
          type: "document_expiry",
          severity: a.severity === "URGENT" ? "danger" : "warning",
          title: a.title,
          message: a.message,
          entityType: a.entity_type,
          entityId: a.entity_id,
          createdAt: new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [setStoreAlerts]);

  useEffect(() => {
    fetchAlerts();
    // Poll every 60s
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalActive = urgentCount + warningCount;

  const handleAlertClick = (id: string, severity: string) => {
    const alert = alerts.find(a => a.id === id);
    if (alert && !alert.read) {
      setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
      if (severity === "URGENT") {
        setUrgentCount(prev => Math.max(0, prev - 1));
      } else {
        setWarningCount(prev => Math.max(0, prev - 1));
      }
    }
    setIsOpen(false);
  };

  const getAlertStyle = (item: AlertItem) => {
    const isUrgent = item.severity === "URGENT";
    const titleLower = item.title.toLowerCase();
    
    // Default base styles
    let style = {
      icon: <AlertTriangle className="h-4 w-4" />,
      bg: isUrgent ? "bg-red-500/10" : "bg-orange-500/10",
      border: isUrgent ? "border-red-500/20" : "border-orange-500/20",
      hoverBg: isUrgent ? "group-hover:bg-red-500/20" : "group-hover:bg-orange-500/20",
      iconColor: isUrgent ? "text-red-400" : "text-orange-400",
      badgeBg: isUrgent ? "bg-red-500/20" : "bg-orange-500/20",
      badgeText: isUrgent ? "text-red-400" : "text-orange-400",
      badgeBorder: isUrgent ? "border-red-500/30" : "border-orange-500/30",
    };

    if (item.type === "STOCK") {
      style.icon = <Package className="h-4 w-4" />;
      style.bg = isUrgent ? "bg-rose-500/10" : "bg-[var(--color-turbo)]/10";
      style.border = isUrgent ? "border-rose-500/30" : "border-[var(--color-turbo)]/30 border-dashed";
      style.hoverBg = isUrgent ? "group-hover:bg-rose-500/20" : "group-hover:bg-[var(--color-turbo)]/20";
      style.iconColor = isUrgent ? "text-rose-500" : "text-[var(--color-turbo)]";
      style.badgeBg = isUrgent ? "bg-rose-500/20" : "bg-[var(--color-turbo)]/20";
      style.badgeText = isUrgent ? "text-rose-400" : "text-[#ffe133]";
      style.badgeBorder = isUrgent ? "border-rose-500/30" : "border-[var(--color-turbo)]/30";
    } else if (item.type === "CONTRAT") {
      style.icon = <Briefcase className="h-4 w-4" />;
      style.bg = "bg-[var(--color-electric-violet)]/10";
      style.border = "border-[var(--color-electric-violet)]/30";
      style.hoverBg = "group-hover:bg-[var(--color-electric-violet)]/20";
      style.iconColor = "text-[#b388eb]";
      style.badgeBg = "bg-[var(--color-electric-violet)]/20";
      style.badgeText = "text-[#b388eb]";
      style.badgeBorder = "border-[var(--color-electric-violet)]/30";
    } else if (item.type === "CAUTION") {
      style.icon = <Banknote className="h-4 w-4" />;
      style.bg = "bg-amber-500/10";
      style.border = "border-amber-500/30";
      style.hoverBg = "group-hover:bg-amber-500/20";
      style.iconColor = "text-amber-400";
      style.badgeBg = "bg-amber-500/20";
      style.badgeText = "text-amber-400";
      style.badgeBorder = "border-amber-500/30";
    } else if (item.type === "DOCUMENT") {
      if (titleLower.includes("assurance")) {
        style.icon = <ShieldAlert className="h-4 w-4" />;
        style.bg = isUrgent ? "bg-red-500/10" : "bg-emerald-500/10";
        style.border = isUrgent ? "border-red-500/30" : "border-emerald-500/30";
        style.hoverBg = isUrgent ? "group-hover:bg-red-500/20" : "group-hover:bg-emerald-500/20";
        style.iconColor = isUrgent ? "text-red-400" : "text-emerald-400";
        style.badgeBg = isUrgent ? "bg-red-500/20" : "bg-emerald-500/20";
        style.badgeText = isUrgent ? "text-red-400" : "text-emerald-400";
        style.badgeBorder = isUrgent ? "border-red-500/30" : "border-emerald-500/30";
      } else if (titleLower.includes("contrôle technique") || titleLower.includes("technique")) {
        style.icon = <CheckSquare className="h-4 w-4" />;
        style.bg = isUrgent ? "bg-rose-500/10" : "bg-slate-400/10";
        style.border = isUrgent ? "border-rose-500/30" : "border-slate-400/30";
        style.hoverBg = isUrgent ? "group-hover:bg-rose-500/20" : "group-hover:bg-slate-400/20";
        style.iconColor = isUrgent ? "text-rose-400" : "text-slate-300";
        style.badgeBg = isUrgent ? "bg-rose-500/20" : "bg-slate-400/20";
        style.badgeText = isUrgent ? "text-rose-400" : "text-slate-300";
        style.badgeBorder = isUrgent ? "border-rose-500/30" : "border-slate-400/30";
      } else if (titleLower.includes("permis")) {
        style.icon = <IdCard className="h-4 w-4" />;
        style.bg = isUrgent ? "bg-red-500/10" : "bg-cyan-500/10";
        style.border = isUrgent ? "border-red-500/30" : "border-cyan-500/30";
        style.hoverBg = isUrgent ? "group-hover:bg-red-500/20" : "group-hover:bg-cyan-500/20";
        style.iconColor = isUrgent ? "text-red-400" : "text-cyan-400";
        style.badgeBg = isUrgent ? "bg-red-500/20" : "bg-cyan-500/20";
        style.badgeText = isUrgent ? "text-red-400" : "text-cyan-400";
        style.badgeBorder = isUrgent ? "border-red-500/30" : "border-cyan-500/30";
      }
    }
    
    // Override border if urgent
    if (isUrgent && !style.border.includes("border-dashed")) {
        style.border += " border-l-[3px]"; 
    }
    
    return style;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="alerts-notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-full p-2 transition-all focus:outline-none ${isOpen ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
        title="Centre d'alertes du système"
      >
        <Bell className="h-5 w-5" />
        {totalActive > 0 && (
          <span
            className={`absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,0,0,0.5)] ${
              urgentCount > 0 ? "bg-red-500 animate-pulse" : "bg-orange-500"
            }`}
          >
            {totalActive > 9 ? "9+" : totalActive}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 max-w-[90vw] rounded-2xl border border-white/10 bg-[var(--color-haiti)]/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white font-heading">Alertes & Conformité</span>
              {totalActive > 0 ? (
                <span className="rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">
                  {totalActive} active(s)
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">
                  0 alerte
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchAlerts}
                className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                title="Actualiser les alertes"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[var(--color-turbo)]" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="relative max-h-[380px] overflow-hidden">
            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-[#1B102B]/60 backdrop-blur-[2px] flex flex-col items-center justify-center"
                >
                  <RefreshCw className="w-8 h-8 text-[var(--color-turbo)] animate-spin mb-2" />
                  <p className="text-[10px] font-accent uppercase tracking-widest text-white/70 font-bold">Actualisation...</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white">Système 100% Conforme</p>
                <p className="text-xs text-white/50 mt-1 max-w-[200px]">
                  Aucune expiration ou rupture de stock détectée.
                </p>
              </div>
            ) : (
              alerts.map((item) => {
                const style = getAlertStyle(item);
                
                return (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => handleAlertClick(item.id, item.severity)}
                    className={`flex items-start gap-4 p-4 transition-colors group block ${item.read ? 'opacity-50 hover:opacity-100 hover:bg-white/5' : 'bg-white/[0.02] hover:bg-white/10'}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors ${style.bg} ${style.border} ${style.hoverBg} ${style.iconColor}`}
                    >
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-xs font-bold truncate ${item.read ? 'text-white/70' : 'text-white'}`}>{item.title}</p>
                        {!item.read && (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-accent uppercase tracking-widest font-bold border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                          >
                            {item.badge_label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 bg-black/20 text-center">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-accent uppercase tracking-widest font-bold text-[var(--color-turbo)] hover:text-[#ffe133] hover:bg-[var(--color-turbo)]/10 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5"
            >
              Consulter le Tableau de bord complet <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
