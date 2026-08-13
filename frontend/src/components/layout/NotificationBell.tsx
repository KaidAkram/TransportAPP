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
} from "lucide-react";
import { api } from "@/lib/api";
import { AlertItem, AlertsResponse } from "@/types/dashboard";
import { useAlertStore } from "@/stores/alertStore";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [urgentCount, setUrgentCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { setAlerts: setStoreAlerts } = useAlertStore();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<AlertsResponse>("/alertes");
      setAlerts(res.data.items);
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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "DOCUMENT":
        return <FileText className="h-4 w-4 text-warning" />;
      case "CONTRAT":
        return <FileText className="h-4 w-4 text-primary-base" />;
      case "CAUTION":
        return <Shield className="h-4 w-4 text-warning" />;
      case "STOCK":
        return <Package className="h-4 w-4 text-danger" />;
      case "MAINTENANCE":
        return <Wrench className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="alerts-notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-text-secondary hover:bg-background hover:text-text-primary transition-colors focus:outline-none"
        title="Centre d'alertes du système"
      >
        <Bell className="h-5 w-5" />
        {totalActive > 0 && (
          <span
            className={`absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white animate-pulse ${
              urgentCount > 0 ? "bg-danger" : "bg-warning"
            }`}
          >
            {totalActive > 9 ? "9+" : totalActive}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] rounded-xl border border-border bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-table-header">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">Alertes & Conformité</span>
              {totalActive > 0 ? (
                <span className="rounded-full bg-danger-bg text-danger-text px-2 py-0.5 text-[10px] font-bold">
                  {totalActive} active(s)
                </span>
              ) : (
                <span className="rounded-full bg-success-bg text-success-text px-2 py-0.5 text-[10px] font-semibold">
                  0 alerte
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchAlerts}
                className="rounded p-1 text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                title="Actualiser les alertes"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {alerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-text-primary">Système 100% Conforme</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Aucune expiration ou rupture de stock détectée.
                </p>
              </div>
            ) : (
              alerts.map((item) => {
                const isUrgent = item.severity === "URGENT";

                return (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-3 hover:bg-primary-light/20 transition-colors group block"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isUrgent ? "bg-danger-bg" : "bg-warning-bg"
                      }`}
                    >
                      {getAlertIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-bold text-text-primary truncate">{item.title}</p>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                            isUrgent
                              ? "bg-danger-bg text-danger-text"
                              : "bg-warning-bg text-warning-text"
                          }`}
                        >
                          {item.badge_label}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-2 leading-tight">
                        {item.message}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border bg-table-header text-center">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-primary-base hover:underline inline-flex items-center gap-1"
            >
              Consulter le Tableau de bord complet <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
