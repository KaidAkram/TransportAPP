"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileEdit, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Avenant } from "@/types/contrat";

const avenantSchema = z.object({
  numero: z.string().min(2, "Le numéro d'avenant est requis (ex: Avenant N°01)"),
  date: z.string().min(1, "La date de signature est requise"),
  objet: z.string().min(5, "L'objet de la modification est requis"),
  description: z.string().optional().nullable(),
  modif_montant: z.number().optional().nullable(),
  nouvelle_date_fin: z.string().optional().nullable(),
});

type AvenantFormValues = z.infer<typeof avenantSchema>;

interface AddAvenantModalProps {
  contratId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAvenant: Avenant) => void;
}

const glassInput = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all shadow-inner font-medium";
const glassInputMono = `${glassInput} font-mono`;
const glassLabel = "block text-[11px] font-accent uppercase tracking-widest text-white/50 mb-2 font-bold";

export function AddAvenantModal({
  contratId,
  isOpen,
  onClose,
  onSuccess,
}: AddAvenantModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AvenantFormValues>({
    resolver: zodResolver(avenantSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  if (!mounted || !isOpen) return null;

  const onSubmit = async (data: AvenantFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<Avenant>(`/contrats/${contratId}/avenants`, {
        ...data,
        modif_montant: data.modif_montant ? Number(data.modif_montant) : null,
        nouvelle_date_fin: data.nouvelle_date_fin || null,
      });

      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'enregistrement de l'avenant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(131,77,251,0.08), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Nouvel Avenant Contractuel</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] mt-0.5">Modification de contrat</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={glassLabel}>
                Numéro Avenant *
              </label>
              <input
                {...register("numero")}
                placeholder="ex: Avenant N°01"
                className={glassInputMono}
              />
              {errors.numero && (
                <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.numero.message}</p>
              )}
            </div>

            <div>
              <label className={glassLabel}>
                Date Signature *
              </label>
              <input
                type="date"
                {...register("date")}
                className={glassInput}
              />
              {errors.date && <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className={glassLabel}>
              Objet de l'Avenant *
            </label>
            <input
              {...register("objet")}
              placeholder="ex: Extension du périmètre & prolongation"
              className={glassInput}
            />
            {errors.objet && <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.objet.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={glassLabel}>
                Variation Montant (+/- DZD)
              </label>
              <input
                type="number"
                {...register("modif_montant", { valueAsNumber: true })}
                placeholder="ex: 500000"
                className={glassInputMono}
              />
            </div>

            <div>
              <label className={glassLabel}>
                Nouvelle Date Fin
              </label>
              <input
                type="date"
                {...register("nouvelle_date_fin")}
                className={glassInput}
              />
            </div>
          </div>

          <div>
            <label className={glassLabel}>
              Description Détaillée
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Explications sur les nouvelles clauses..."
              className={`${glassInput} resize-none`}
            />
          </div>

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
              className="bg-[var(--color-electric-violet)] hover:bg-[#6A3DE8] text-white shadow-[0_0_20px_rgba(131,77,251,0.3)] hover:shadow-[0_0_30px_rgba(131,77,251,0.5)] transition-all font-bold px-6"
            >
              {isSubmitting ? "Enregistrement..." : "Confirmer Avenant"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
