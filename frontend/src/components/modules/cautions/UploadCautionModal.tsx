"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Upload, X, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Caution } from "@/types/caution";
import { GlassSelect } from "@/components/ui/GlassSelect";

interface UploadCautionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCaution: Caution) => void;
  caution: Caution;
  step: "ORIGINALE" | "PREUVE";
}

export function UploadCautionModal({
  isOpen,
  onClose,
  onSuccess,
  caution,
  step,
}: UploadCautionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<"SOUMISSION" | "BONNE_EXECUTION">("SOUMISSION");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setFile(null);
      setServerError(null);
      setSelectedType("SOUMISSION");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const isOriginale = step === "ORIGINALE";
  const title = isOriginale
    ? "Téléverser la Caution Originale"
    : "Téléverser la Preuve Client";
  const subtitle = isOriginale
    ? "La caution émise par la banque — le type passe à Soumission ou Bonne Exécution"
    : "La preuve de réception par le client — statut passe à Récupéré";
  const documentType = isOriginale
    ? "Caution Originale de la banque"
    : "Preuve Client";
  const nextStatus = isOriginale ? "CHEZ_CLIENT" : "RETOURNEE";

  const handleSubmit = async () => {
    if (!file) {
      setServerError("Veuillez sélectionner un fichier.");
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      if (isOriginale) {
        await api.put(`/cautions/${caution.id}`, {
          type: selectedType,
          statut: "CHEZ_CLIENT",
        });
      } else {
        await api.put(`/cautions/${caution.id}`, {
          statut: "RETOURNEE",
        });
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("entity_type", "caution");
      formData.append("entity_id", caution.id);
      formData.append("document_type", documentType);
      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const res = await api.get<Caution>(`/cautions/${caution.id}`);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors du téléversement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass =
    "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] pointer-events-none rounded-full bg-[var(--color-turbo)]/10" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-turbo)]/20 bg-[var(--color-turbo)]/10 text-[var(--color-turbo)]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">{title}</h2>
              <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 relative z-10">
          {/* Caution info */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Caution</p>
            <p className="text-sm font-bold text-white font-mono">{caution.numero}</p>
            <p className="text-xs text-white/60 mt-1">{caution.objet}</p>
          </div>

          {/* Type selector (only for ORIGINALE step) */}
          {isOriginale && (
            <div>
              <label className={labelClass}>Type de Garantie</label>
              <GlassSelect
                value={selectedType}
                onChange={(val) => setSelectedType(val as "SOUMISSION" | "BONNE_EXECUTION")}
                options={[
                  { value: "SOUMISSION", label: "Soumission (Appel d'Offres)" },
                  { value: "BONNE_EXECUTION", label: "Bonne Exécution" },
                ]}
              />
            </div>
          )}

          {/* File upload */}
          <div>
            <label className={labelClass}>
              {isOriginale ? "Caution Originale de la banque" : "Preuve Client"}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--color-electric-violet)]/30 transition-all cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-[var(--color-turbo)] mb-2" />
                  <p className="text-xs font-bold text-white text-center px-2">{file.name}</p>
                  <p className="text-[10px] text-white/40 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-white/30 mb-2" />
                  <p className="text-xs text-white/50">Cliquer pour sélectionner un fichier</p>
                  <p className="text-[10px] text-white/30 mt-1">PDF, JPG, PNG</p>
                </>
              )}
            </label>
          </div>

          {serverError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !file}
            className={`px-6 py-2 rounded-xl text-xs font-bold bg-[var(--color-turbo)] text-[var(--color-haiti)] hover:bg-[#c8b400] hover:shadow-[0_0_20px_rgba(240,225,0,0.4)] transition-all flex items-center gap-2 ${
              isSubmitting || !file ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              "Envoi..."
            ) : (
              <>
                Valider <CheckCircle2 className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
