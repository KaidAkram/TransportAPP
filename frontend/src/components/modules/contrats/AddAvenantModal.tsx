"use client";

import React, { useState } from "react";
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

export function AddAvenantModal({
  contratId,
  isOpen,
  onClose,
  onSuccess,
}: AddAvenantModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-table-header">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nouvel Avenant Contractuel</h2>
              <p className="text-xs text-text-secondary">Modification de montant, durée ou clauses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-bg p-3 text-xs text-danger-text border border-danger/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Numéro Avenant *
              </label>
              <input
                {...register("numero")}
                placeholder="ex: Avenant N°01"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.numero && (
                <p className="text-[11px] text-danger mt-1">{errors.numero.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date Signature *
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.date && <p className="text-[11px] text-danger mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Objet de l&apos;Avenant *
            </label>
            <input
              {...register("objet")}
              placeholder="ex: Extension du périmètre de transport & prolongation"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.objet && <p className="text-[11px] text-danger mt-1">{errors.objet.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Variation Montant (+/- DZD)
              </label>
              <input
                type="number"
                step="1000"
                {...register("modif_montant", { valueAsNumber: true })}
                placeholder="ex: 2500000"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Nouvelle Date Fin
              </label>
              <input
                type="date"
                {...register("nouvelle_date_fin")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Description & Clauses Modifiées
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Détaillez les nouvelles conditions ou circuits ajoutés..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs border-border"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              {isSubmitting ? "Enregistrement..." : "Ajouter l'avenant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
