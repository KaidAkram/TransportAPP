"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertTriangle, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ConstatSummary } from "@/types/vehicule";

const constatSchema = z.object({
  date: z.string().min(1, "La date de l'incident est requise"),
  heure: z.string().optional().nullable(),
  lieu: z.string().min(3, "Le lieu de l'accident est requis"),
  circonstances: z.string().min(5, "Les circonstances doivent être détaillées"),
  dommages: z.string().min(3, "La description des dommages est requise"),
  tiers_implique: z.boolean(),
  infos_tiers: z.string().optional().nullable(),
});

type ConstatFormValues = z.infer<typeof constatSchema>;

interface AddConstatModalProps {
  vehiculeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newConstat: ConstatSummary) => void;
}

export function AddConstatModal({ vehiculeId, isOpen, onClose, onSuccess }: AddConstatModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ConstatFormValues>({
    resolver: zodResolver(constatSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      tiers_implique: false,
    },
  });

  const tiersImplique = watch("tiers_implique");

  if (!isOpen) return null;

  const onSubmit = async (data: ConstatFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const res = await api.post<ConstatSummary>(`/vehicules/${vehiculeId}/constats`, {
        ...data,
        vehicule_id: vehiculeId,
        heure: data.heure || null,
        infos_tiers: data.infos_tiers || null,
      });
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la déclaration du constat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-danger-bg">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-danger-text">Déclarer un Constat d&apos;Accident</h2>
              <p className="text-xs text-danger-text/80">Enregistrement d&apos;un sinistre ou dommage matériel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-danger-text hover:bg-black/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-bg p-3 text-xs text-danger-text border border-danger/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date de l&apos;accident *
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.date && <p className="text-[11px] text-danger mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Heure approximative
              </label>
              <input
                type="text"
                {...register("heure")}
                placeholder="ex: 14h30"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Lieu précis du sinistre *
            </label>
            <input
              {...register("lieu")}
              placeholder="ex: RN4 PK 28, Sortie Oued Tlelat, Oran"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.lieu && <p className="text-[11px] text-danger mt-1">{errors.lieu.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Circonstances de l&apos;accident *
            </label>
            <textarea
              {...register("circonstances")}
              rows={3}
              placeholder="Décrivez précisément les faits, la météo, la vitesse et le comportement des véhicules..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.circonstances && <p className="text-[11px] text-danger mt-1">{errors.circonstances.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Dommages matériels constatés *
            </label>
            <textarea
              {...register("dommages")}
              rows={2}
              placeholder="ex: Rétroviseur droit brisé, aile avant droite froissée, pare-chocs fissuré..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.dommages && <p className="text-[11px] text-danger mt-1">{errors.dommages.message}</p>}
          </div>

          {/* Tiers Impliqué Checkbox */}
          <div className="rounded-lg border border-border p-3 bg-table-header">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("tiers_implique")}
                className="h-4 w-4 rounded border-border text-primary-base focus:ring-primary-base"
              />
              <span className="text-xs font-medium text-text-primary">
                Un tiers ou autre véhicule est impliqué dans l&apos;accident
              </span>
            </label>

            {tiersImplique && (
              <div className="mt-3 pt-3 border-t border-border">
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Informations sur le tiers (Conducteur, Véhicule, N° Assurance, Tél)
                </label>
                <textarea
                  {...register("infos_tiers")}
                  rows={2}
                  placeholder="Nom du tiers, Immatriculation tiers, Compagnie d'assurance adverse et n° de police..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
            )}
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
              className="text-xs bg-danger hover:bg-danger/90 text-white"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer le constat"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
