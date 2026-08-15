"use client";

import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface GlassConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "success" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GlassConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "warning",
  onConfirm,
  onCancel,
  isLoading = false,
}: GlassConfirmModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      button: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
    },
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      button: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30",
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-[var(--color-turbo)]" />,
      bg: "bg-[var(--color-turbo)]/10",
      border: "border-[var(--color-turbo)]/20",
      button: "bg-[var(--color-turbo)]/20 text-[var(--color-turbo)] border border-[var(--color-turbo)]/30 hover:bg-[var(--color-turbo)]/30",
    },
    info: {
      icon: <AlertTriangle className="w-8 h-8 text-[var(--color-electric-violet)]" />,
      bg: "bg-[var(--color-electric-violet)]/10",
      border: "border-[var(--color-electric-violet)]/20",
      button: "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/50 hover:bg-[var(--color-electric-violet)]/40 shadow-[0_0_15px_rgba(131,77,251,0.3)]",
    },
  };

  const config = typeConfig[type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : onCancel}
          className="absolute inset-0 bg-[#0B0514]/80 backdrop-blur-md"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md glass-panel p-0 overflow-hidden shadow-2xl"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-electric-violet)] to-transparent opacity-50" />

          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-2">
            <div className={`p-3 rounded-2xl ${config.bg} ${config.border} border`}>
              {config.icon}
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <h3 className="text-xl font-heading font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{message}</p>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 bg-black/20 border-t border-white/5 flex items-center justify-end gap-3 mt-2">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50 ${config.button}`}
            >
              {isLoading && (
                <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
