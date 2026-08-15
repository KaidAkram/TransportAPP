"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { EmployeDocument } from "@/types/employe";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const docSchema = z.object({
  nom: z.string().min(2, "Le nom du document est requis"),
  type: z.string().min(2, "Le type est requis"),
  url_fichier: z.string().optional(),
  date_emission: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
});

type DocFormValues = z.infer<typeof docSchema>;

const glassInput = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all";
const glassInputDate = `${glassInput} [color-scheme:dark]`;
const glassSelect = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all appearance-none cursor-pointer [color-scheme:dark]";
const glassLabel = "block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2";

interface AddEmployeeDocumentModalProps {
  employeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: EmployeDocument) => void;
}

export function AddEmployeeDocumentModal({
  employeId,
  isOpen,
  onClose,
  onSuccess,
}: AddEmployeeDocumentModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocFormValues>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      type: "CNI",
    },
  });

  if (!mounted || !isOpen) return null;

  const onSubmit = async (data: DocFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // If files are pending, upload them
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("entity_type", "employe");
          uploadData.append("entity_id", employeId);
          uploadData.append("document_type", data.type);
          uploadData.append("nom", data.nom);
          if (data.date_emission) uploadData.append("date_emission", data.date_emission);
          if (data.date_expiration) uploadData.append("date_expiration", data.date_expiration);

          const res = await api.post<EmployeDocument>("/upload", uploadData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          onSuccess(res.data);
        }
        reset();
        setPendingFiles([]);
        onClose();
      } else {
        const res = await api.post<EmployeDocument>(`/employes/${employeId}/documents`, {
          ...data,
          date_emission: data.date_emission || null,
          date_expiration: data.date_expiration || null,
          entity_type: "employe",
          entity_id: employeId,
        });

        reset();
        setPendingFiles([]);
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'enregistrement du document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(131,77,251,0.05), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Ajouter un Document RH</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mt-0.5">CNI, Extrait de naissance, Carte Chifa, Contrat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="relative p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 p-4 border border-rose-500/20">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span className="text-xs text-rose-200 font-medium">{serverError}</span>
            </div>
          )}

          <div>
            <label className={glassLabel}>
              Type de document <span className="text-rose-400">*</span>
            </label>
            <select {...register("type")} className={glassSelect}>
              <option value="CNI">Carte Nationale d&apos;Identité (CNI)</option>
              <option value="Extrait de naissance">Extrait de Naissance (12S)</option>
              <option value="Carte Chifa">Carte Chifa / CNAS</option>
              <option value="Contrat de travail">Contrat de Travail</option>
              <option value="Certificat médical">Certificat Médical d&apos;Aptitude</option>
              <option value="Autre">Autre document administratif</option>
            </select>
          </div>

          <div>
            <label className={glassLabel}>
              Intitulé du document <span className="text-rose-400">*</span>
            </label>
            <input
              {...register("nom")}
              placeholder="ex: CNI Biométrique 2026"
              className={glassInput}
            />
            {errors.nom && <p className="text-[11px] text-rose-400 mt-1.5">{errors.nom.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={glassLabel}>Date d&apos;émission</label>
              <input type="date" {...register("date_emission")} className={glassInputDate} />
            </div>
            <div>
              <label className={glassLabel}>Date d&apos;expiration</label>
              <input type="date" {...register("date_expiration")} className={glassInputDate} />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className={glassLabel}>Fichier à télécharger</label>
            <CreationFileUploader
              files={pendingFiles}
              onFilesChange={setPendingFiles}
              maxFiles={3}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[var(--color-electric-violet)]/90 hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer le document"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
