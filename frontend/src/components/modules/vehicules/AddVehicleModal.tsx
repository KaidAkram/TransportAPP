"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Bus, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Vehicule } from "@/types/vehicule";

const vehicleSchema = z.object({
  immatriculation: z
    .string()
    .min(5, "L'immatriculation doit comporter au moins 5 caractères")
    .regex(/^[0-9A-Za-z\s-]+$/, "Format d'immatriculation invalide (ex: 16-123456-00)"),
  marque: z.string().min(2, "La marque est requise"),
  modele: z.string().min(2, "Le modèle est requis"),
  type: z.string().min(2, "Le type est requis"),
  nombre_places: z.coerce.number().min(1, "Au moins 1 place requise"),
  annee: z.coerce.number().min(1980).max(2035).optional().nullable(),
  date_mise_circulation: z.string().optional().nullable(),
  kilometrage_actuel: z.coerce.number().min(0, "Le kilométrage ne peut être négatif"),
  statut: z.enum(["DISPONIBLE", "EN_MISSION", "MAINTENANCE", "IMMOBILISE", "HORS_SERVICE"]),
  cout_total: z.coerce.number().min(0),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVehicle: Vehicule) => void;
}

export function AddVehicleModal({ isOpen, onClose, onSuccess }: AddVehicleModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      statut: "DISPONIBLE",
      type: "Bus",
      nombre_places: 49,
      kilometrage_actuel: 0,
      cout_total: 0,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const res = await api.post<Vehicule>("/vehicules", {
        ...data,
        date_mise_circulation: data.date_mise_circulation || null,
        annee: data.annee || null,
      });
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création du véhicule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-table-header">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Ajouter un Véhicule</h2>
              <p className="text-xs text-text-secondary">Enregistrement dans le parc automobile</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-bg p-3 text-xs text-danger-text border border-danger/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Immatriculation */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Immatriculation *
              </label>
              <input
                {...register("immatriculation")}
                placeholder="ex: 16-123456-00"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.immatriculation && (
                <p className="text-[11px] text-danger mt-1">{errors.immatriculation.message}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Type de véhicule *
              </label>
              <select
                {...register("type")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="Bus">Bus</option>
                <option value="Minibus">Minibus</option>
                <option value="Voiture">Voiture</option>
                <option value="Van">Van / Fourgon</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Marque */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Marque *
              </label>
              <input
                {...register("marque")}
                placeholder="ex: Mercedes-Benz, Iveco, Renault"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.marque && (
                <p className="text-[11px] text-danger mt-1">{errors.marque.message}</p>
              )}
            </div>

            {/* Modèle */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Modèle *
              </label>
              <input
                {...register("modele")}
                placeholder="ex: Tourismo, Crossway, Master"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.modele && (
                <p className="text-[11px] text-danger mt-1">{errors.modele.message}</p>
              )}
            </div>

            {/* Nombre de places */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Nombre de places *
              </label>
              <input
                type="number"
                {...register("nombre_places")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.nombre_places && (
                <p className="text-[11px] text-danger mt-1">{errors.nombre_places.message}</p>
              )}
            </div>

            {/* Kilométrage actuel */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Kilométrage initial (km) *
              </label>
              <input
                type="number"
                step="any"
                {...register("kilometrage_actuel")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            {/* Année */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Année de fabrication
              </label>
              <input
                type="number"
                {...register("annee")}
                placeholder="ex: 2023"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            {/* Date mise en circulation */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date 1ère mise en circulation
              </label>
              <input
                type="date"
                {...register("date_mise_circulation")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            {/* Statut initial */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Statut initial
              </label>
              <select
                {...register("statut")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="DISPONIBLE">🟢 Disponible</option>
                <option value="EN_MISSION">🟠 En mission</option>
                <option value="MAINTENANCE">🟠 En maintenance</option>
                <option value="IMMOBILISE">🔴 Immobilisé</option>
                <option value="HORS_SERVICE">⚪ Hors service</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer le véhicule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
