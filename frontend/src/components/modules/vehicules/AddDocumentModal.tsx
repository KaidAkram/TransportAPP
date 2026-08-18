"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { DocumentSummary } from "@/types/vehicule";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const documentSchema = z.object({
  nom: z.string().min(2, "Le nom du document est requis"),
  type: z.string().min(2, "Le type de document est requis"),
  url_fichier: z.string().optional(),
  date_emission: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface AddDocumentModalProps {
  vehiculeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: DocumentSummary) => void;
  defaultType?: string;
}

export function AddDocumentModal({ vehiculeId, isOpen, onClose, onSuccess, defaultType }: AddDocumentModalProps) {
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
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: defaultType || "Assurance",
      url_fichier: "",
    },
  });

  // Effectue la réinitialisation si `defaultType` change pour que le formulaire prenne la bonne valeur
  useEffect(() => {
    if (defaultType) {
      reset({ type: defaultType, url_fichier: "" });
    } else {
      reset({ type: "Assurance", url_fichier: "" });
    }
  }, [defaultType, reset]);

  const onSubmit = async (data: DocumentFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      if (pendingFiles.length > 0) {
        const formData = new FormData();
        formData.append("file", pendingFiles[0]);
        formData.append("entity_type", "vehicule");
        formData.append("entity_id", vehiculeId);
        formData.append("document_type", data.type);
        formData.append("nom", data.nom);
        if (data.date_emission) formData.append("date_emission", data.date_emission);
        if (data.date_expiration) formData.append("date_expiration", data.date_expiration);

        const res = await api.post<DocumentSummary>("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        reset();
        setPendingFiles([]);
        onSuccess(res.data);
        onClose();
      } else {
        const res = await api.post<DocumentSummary>(`/vehicules/${vehiculeId}/documents`, {
          ...data,
          date_emission: data.date_emission || null,
          date_expiration: data.date_expiration || null,
          entity_type: "vehicule",
          entity_id: vehiculeId,
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

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(131,77,251,0.05), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] shadow-[0_0_15px_rgba(131,77,251,0.2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-white drop-shadow-sm">Ajouter un Document</h2>
              <p className="text-xs text-white/50 mt-0.5 font-sans">Assurance, Carte grise, Contrôle technique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition-all"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="relative p-6 space-y-5">
          {serverError && (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 border border-red-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mb-5">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span className="text-xs text-red-200 font-medium">{serverError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
              Type de document <span className="text-[var(--color-turbo)]">*</span>
            </label>
            <select
              {...register("type")}
              disabled={!!defaultType}
              className={`w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm ${!!defaultType ? 'text-white/50 cursor-not-allowed' : 'text-white cursor-pointer'} focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[#251739] transition-all appearance-none`}
              style={!defaultType ? { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1.25rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` } : {}}
            >
              <option value="Assurance">Assurance</option>
              <option value="Contrôle technique">Contrôle technique</option>
              <option value="Carte grise">Carte grise</option>
              <option value="Vignette automobile">Vignette automobile</option>
              <option value="Autre">Autre document</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
              Intitulé du document <span className="text-[var(--color-turbo)]">*</span>
            </label>
            <input
              {...register("nom")}
              placeholder="ex: Police Assurance Flotte 2026-2027"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all"
            />
            {errors.nom && <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.nom.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                Date d&apos;émission
              </label>
              <input
                type="date"
                {...register("date_emission")}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[#251739] transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                Date d&apos;expiration
              </label>
              <input
                type="date"
                {...register("date_expiration")}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[#251739] transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
              Fichier Joint <span className="text-[var(--color-turbo)]">*</span>
            </label>
            <CreationFileUploader
              files={pendingFiles}
              onFilesChange={setPendingFiles}
              maxFiles={1}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 border border-transparent transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--color-electric-violet)] hover:bg-[#9d6cfc] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_20px_rgba(131,77,251,0.4)] transition-all flex items-center gap-2"
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
