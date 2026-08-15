"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ContratDocument } from "@/types/contrat";
import { GlassSelect } from "@/components/ui/GlassSelect";

const docSchema = z.object({
  nom: z.string().min(2, "Le nom du document est requis"),
  type: z.string().min(2, "Le type est requis"),
  url_fichier: z.string().min(2, "Le chemin du fichier est requis"),
  date_emission: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
});

type DocFormValues = z.infer<typeof docSchema>;

interface AddContractDocumentModalProps {
  contratId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: ContratDocument) => void;
}

const glassInput = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all shadow-inner font-medium";
const glassInputMono = `${glassInput} font-mono`;
const glassLabel = "block text-[11px] font-accent uppercase tracking-widest text-white/50 mb-2 font-bold";

export function AddContractDocumentModal({
  contratId,
  isOpen,
  onClose,
  onSuccess,
}: AddContractDocumentModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocFormValues>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      type: "Convention Signée",
      url_fichier: "/assets/documents/contrat_signe.pdf",
    },
  });

  if (!mounted || !isOpen) return null;

  const onSubmit = async (data: DocFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<ContratDocument>(`/contrats/${contratId}/documents`, {
        ...data,
        date_emission: data.date_emission || null,
        date_expiration: data.date_expiration || null,
        entity_type: "contrat",
        entity_id: contratId,
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
        className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(14,165,233,0.08), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0ea5e9]/20 text-[#0ea5e9] border border-[#0ea5e9]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Ajouter une Pièce Contractuelle</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[#0ea5e9] mt-0.5">Scan, PDF ou avenant</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div>
            <label className={glassLabel}>
              Type de Document *
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  options={[
                    { value: "Convention Signée", label: "Convention Commerciale Signée (PDF)" },
                    { value: "Bon de Commande", label: "Bon de Commande / Ordre de Service" },
                    { value: "Cahier des Charges", label: "Cahier des Clauses Particulières (CCP)" },
                    { value: "Avenant Signé", label: "Scan de l'Avenant Signé" },
                    { value: "Autre", label: "Autre Annexe Contractuelle" },
                  ]}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Sélectionner..."
                />
              )}
            />
          </div>

          <div>
            <label className={glassLabel}>
              Intitulé du document *
            </label>
            <input
              {...register("nom")}
              placeholder="ex: Convention Signée Sonatrach 2026"
              className={glassInput}
            />
            {errors.nom && <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.nom.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={glassLabel}>Date d'émission</label>
              <input
                type="date"
                {...register("date_emission")}
                className={glassInput}
              />
            </div>

            <div>
              <label className={glassLabel}>Date d'expiration</label>
              <input
                type="date"
                {...register("date_expiration")}
                className={glassInput}
              />
            </div>
          </div>

          {/* Hidden File Input for Demo Purposes */}
          <div className="hidden">
            <input
              {...register("url_fichier")}
              type="text"
            />
          </div>
          {errors.url_fichier && (
            <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.url_fichier.message}</p>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/70 hover:text-white hover:bg-white/10 font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transition-all font-bold px-6"
            >
              {isSubmitting ? "Ajout en cours..." : "Ajouter le Document"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
