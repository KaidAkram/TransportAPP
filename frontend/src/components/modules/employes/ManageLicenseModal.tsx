"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, X, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Permis } from "@/types/employe";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const licenseSchema = z.object({
  numero: z.string().min(4, "Le numéro de permis est requis"),
  categories: z.string().min(1, "Au moins une catégorie est requise (ex: B, D, D1)"),
  date_obtention: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
  scan_permis: z.string().optional().nullable(),
});

type LicenseFormValues = z.infer<typeof licenseSchema>;

interface ManageLicenseModalProps {
  chauffeurId: string;
  existingPermis?: Permis | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPermis: Permis) => void;
}

export function ManageLicenseModal({
  chauffeurId,
  existingPermis,
  isOpen,
  onClose,
  onSuccess,
}: ManageLicenseModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      numero: existingPermis?.numero || "",
      categories: existingPermis?.categories || "B, D, D1",
      date_obtention: existingPermis?.date_obtention || null,
      date_expiration: existingPermis?.date_expiration || null,
      scan_permis: existingPermis?.scan_permis || "",
    },
  });

  if (!isOpen || !mounted) return null;

  const onSubmit = async (data: LicenseFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // In a real scenario, you'd map uploadedFileId to the scan_permis or link it in the backend
      // Here we keep the API contract the same but could pass uploadedFileId if needed.
      const scanUrl = uploadedFileId ? `/api/v1/documents/${uploadedFileId}/download` : data.scan_permis;

      const res = await api.post<Permis>(`/employes/${chauffeurId}/permis`, {
        ...data,
        scan_permis: scanUrl || null,
        date_obtention: data.date_obtention || null,
        date_expiration: data.date_expiration || null,
      });

      reset();
      setUploadedFileId(null);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la mise à jour du permis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]";

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-electric-violet)]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30 shadow-[0_0_15px_rgba(131,77,251,0.2)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-heading text-white tracking-wide">
                Permis de Conduire
              </h2>
              <p className="text-[10px] text-white/50 font-accent uppercase tracking-wider mt-0.5">
                Suivi & Validité
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {serverError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-1.5 ml-1">
                  Numéro de Permis *
                </label>
                <input
                  {...register("numero")}
                  placeholder="ex: DZ-31-987654"
                  className={`${inputClass} font-mono font-bold`}
                />
                {errors.numero && <p className="text-[10px] text-red-400 mt-1.5 ml-1">{errors.numero.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-1.5 ml-1">
                  Catégories Validées (ex: B, D, CE) *
                </label>
                <input
                  {...register("categories")}
                  placeholder="ex: B, D, D1"
                  className={`${inputClass} font-mono`}
                />
                {errors.categories && <p className="text-[10px] text-red-400 mt-1.5 ml-1">{errors.categories.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-1.5 ml-1">
                    Date d&apos;obtention
                  </label>
                  <input
                    type="date"
                    {...register("date_obtention")}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-1.5 ml-1">
                    Date d&apos;expiration
                  </label>
                  <input
                    type="date"
                    {...register("date_expiration")}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-1.5 ml-1">
                  Scan / Photo du Permis
                </label>
                <div className="mb-2">
                  <CreationFileUploader
                    files={files}
                    onFilesChange={setFiles}
                    maxFiles={1}
                  />
                </div>
                {/* Fallback field if they just want to put a URL */}
                <input
                  {...register("scan_permis")}
                  placeholder="Ou URL externe (optionnel)"
                  className={`${inputClass} font-mono opacity-50 focus:opacity-100`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl bg-[var(--color-electric-violet)] text-white hover:bg-[var(--color-electric-violet)]/90 shadow-[0_0_15px_rgba(131,77,251,0.3)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer le permis"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
