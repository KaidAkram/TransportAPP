"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { PartenaireDocument } from "@/types/partenaire";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";
import { GlassSelect } from "@/components/ui/GlassSelect";

const docSchema = z.object({
  nom: z.string().min(2, "Le nom du document est requis"),
  type: z.string().min(2, "Le type est requis"),
  url_fichier: z.string().min(2, "Le chemin du fichier est requis"),
  date_emission: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
});

type DocFormValues = z.infer<typeof docSchema>;

interface AddPartnerDocumentModalProps {
  partenaireId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: PartenaireDocument) => void;
}

// Reusable glass input class
const glassInput = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all";
const glassInputMono = `${glassInput} font-mono`;
const glassSelect = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all appearance-none cursor-pointer [color-scheme:dark]";
const glassLabel = "block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2";

export function AddPartnerDocumentModal({
  partenaireId,
  isOpen,
  onClose,
  onSuccess,
}: AddPartnerDocumentModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DocFormValues>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      type: "Registre de Commerce",
      url_fichier: "/assets/documents/doc_partenaire.pdf",
    },
  });

  if (!isOpen || !mounted) return null;

  const onSubmit = async (data: DocFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<PartenaireDocument>(`/partenaires/${partenaireId}/documents`, {
        ...data,
        date_emission: data.date_emission || null,
        date_expiration: data.date_expiration || null,
        entity_type: "partenaire",
        entity_id: partenaireId,
      });

      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'enregistrement du document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(131,77,251,0.05), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Ajouter un Document Juridique / Fiscal</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mt-0.5">RC, NIF, Agrément ministériel, Statuts</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="relative p-6 space-y-5 overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 p-4 border border-rose-500/20">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span className="text-xs text-rose-200 font-medium">{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={glassLabel}>
                Type de Document <span className="text-rose-400">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "Registre de Commerce", label: "Extrait du Registre de Commerce (RC)" },
                      { value: "Attestation NIF/NIS", label: "Attestation d'Immatriculation Fiscale (NIF)" },
                      { value: "Agrément de Tourisme", label: "Agrément Ministériel de Transport / Tourisme" },
                      { value: "Statuts Entreprise", label: "Statuts Juridiques (SARL / SPA / EURL)" },
                      { value: "Autre", label: "Autre document d'entreprise" },
                    ]}
                  />
                )}
              />
            </div>

            <div>
              <label className={glassLabel}>
                Intitulé du document <span className="text-rose-400">*</span>
              </label>
              <input
                {...register("nom")}
                placeholder="ex: RC Biométrique 2026"
                className={glassInput}
              />
              {errors.nom && <p className="text-[11px] text-rose-400 mt-1">{errors.nom.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>Date d&apos;émission</label>
              <input
                type="date"
                {...register("date_emission")}
                className={glassInput}
              />
            </div>

            <div>
              <label className={glassLabel}>Date d&apos;expiration</label>
              <input
                type="date"
                {...register("date_expiration")}
                className={glassInput}
              />
            </div>
          </div>

          <div>
            <label className={glassLabel}>Document à uploader <span className="text-rose-400">*</span></label>
            <CreationFileUploader files={files} onFilesChange={setFiles} maxFiles={1} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-[var(--color-electric-violet)] rounded-xl hover:bg-[var(--color-electric-violet)]/80 shadow-[0_0_20px_rgba(131,77,251,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
