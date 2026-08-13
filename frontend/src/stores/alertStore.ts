import { create } from "zustand";

interface Alert {
  id: string;
  type: "document_expiry" | "low_stock" | "overdue_maintenance" | "contract_expiry";
  severity: "warning" | "danger";
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  setAlerts: (alerts: Alert[]) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,
  setAlerts: (alerts) => set({ alerts, unreadCount: alerts.length }),
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
}));
