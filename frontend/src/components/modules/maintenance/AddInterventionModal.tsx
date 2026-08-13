"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wrench, X, AlertCircle, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Intervention } from "@/types/intervention";
import { Vehicule, VehiculeListResponse } from "@/types/vehicule";
import { Employe, EmployeListResponse } from "@/types/employe";
import { Piece, PieceListResponse } from "@/types/stock";

const pieceUsageSchema = z.object({
  piece_id: z.string().min(1, "Veuillez sélectionner une pièce"),
  quantite: z.number().min(1, "La quantité doit être >= 1"),
});

const interventionSchema = z.object({
  numero: z.string().min(2, "Le numéro d'ordre de travail est requis (ex: INT-2026-0012)"),
  vehicule_id: z.string().min(1, "Veuillez sélectionner un véhicule"),
  mecanicien_responsable_id: z.string().optional().nullable(),
  type: z.enum(["PREVENTIVE", "CORRECTIVE"]),
  categorie: z.string().min(1, "La catégorie de travaux est requise"),
  date: z.string().min(1, "La date est requise"),
  kilometrage: z.number().min(0, "Le kilométrage doit être positif"),
  probleme_constate: z.string().optional().nullable(),
  diagnostic: z.string().optional().nullable(),
  travail_effectue: z.string().optional().nullable(),
  cout_total: z.number().min(0, "Le coût doit être positif"),
  prochaine_date_maintenance: z.string().optional().nullable(),
  prochain_kilo_maintenance: z.number().optional().nullable(),
  statut: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]),
  pieces_utilisees: z.array(pieceUsageSchema).optional(),
});

type InterventionFormValues = z.infer<typeof interventionSchema>;

interface AddInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newIntervention: Intervention) => void;
  defaultVehiculeId?: string;
  defaultMecanicienId?: string;
}

export function AddInterventionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultVehiculeId,
  defaultMecanicienId,
}: AddInterventionModalProps) {
  const [vehicles, setVehicles] = useState<Vehicule[]>([]);
  const [mechanics, setMechanics] = useState<Employe[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InterventionFormValues>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      numero: `INT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: "PREVENTIVE",
      categorie: "Freinage & Révision",
      date: new Date().toISOString().split("T")[0],
      kilometrage: 0,
      cout_total: 0,
      statut: "TERMINEE",
      vehicule_id: defaultVehiculeId || "",
      mecanicien_responsable_id: defaultMecanicienId || "",
      pieces_utilisees: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pieces_utilisees",
  });

  useEffect(() => {
    if (isOpen) {
      api
        .get<VehiculeListResponse>("/vehicules", { per_page: "100" })
        .then((res) => setVehicles(res.data.items))
        .catch(console.error);

      api
        .get<EmployeListResponse>("/employes", { type_employe: "MECANICIEN", per_page: "100" })
        .then((res) => setMechanics(res.data.items))
        .catch(console.error);

      api
        .get<PieceListResponse>("/stock/pieces", { per_page: "100" })
        .then((res) => setPieces(res.data.items))
        .catch(console.error);

      if (defaultVehiculeId) setValue("vehicule_id", defaultVehiculeId);
      if (defaultMecanicienId) setValue("mecanicien_responsable_id", defaultMecanicienId);
    }
  }, [isOpen, defaultVehiculeId, defaultMecanicienId, setValue]);

  if (!isOpen) return null;

  const onSubmit = async (data: InterventionFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        ...data,
        kilometrage: Number(data.kilometrage),
        cout_total: Number(data.cout_total),
        prochain_kilo_maintenance: data.prochain_kilo_maintenance
          ? Number(data.prochain_kilo_maintenance)
          : null,
        prochaine_date_maintenance: data.prochaine_date_maintenance || null,
        mecanicien_responsable_id: data.mecanicien_responsable_id || null,
        pieces_utilisees: (data.pieces_utilisees || []).map((p) => ({
          piece_id: p.piece_id,
          quantite: Number(p.quantite),
        })),
      };

      const res = await api.post<Intervention>("/interventions", payload);
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de l'ordre de travail.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-table-header">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nouvel Ordre de Travail (OT)</h2>
              <p className="text-xs text-text-secondary">Maintenance véhicule avec déduction automatique des pièces du stock</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-bg p-3 text-xs text-danger-text border border-danger/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                N° Ordre de Travail *
              </label>
              <input
                {...register("numero")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.numero && <p className="text-[11px] text-danger mt-1">{errors.numero.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Véhicule Concerné *
              </label>
              <select
                {...register("vehicule_id")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Sélectionner un véhicule...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.immatriculation} — {v.marque} {v.modele}
                  </option>
                ))}
              </select>
              {errors.vehicule_id && (
                <p className="text-[11px] text-danger mt-1">{errors.vehicule_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Mécanicien Responsable
              </label>
              <select
                {...register("mecanicien_responsable_id")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Sélectionner le chef d&apos;équipe...</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} {m.prenom} ({m.specialite || "Atelier"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Type *</label>
              <select
                {...register("type")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="PREVENTIVE">🟢 Préventive (Entretien)</option>
                <option value="CORRECTIVE">🔴 Corrective (Panne/Casse)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Catégorie *</label>
              <input
                {...register("categorie")}
                placeholder="Vidange, Freinage, Moteur"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Date *</label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Kilométrage Véhicule *</label>
              <input
                type="number"
                {...register("kilometrage", { valueAsNumber: true })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Anomalies / Problème constaté</label>
              <textarea
                {...register("probleme_constate")}
                rows={2}
                placeholder="Bruits au freinage, baisse de pression, voyant allumé..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Travaux & Réparations Réalisés</label>
              <textarea
                {...register("travail_effectue")}
                rows={2}
                placeholder="Remplacement des plaquettes avant, purge du circuit..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          {/* DYNAMIC CONSUMED SPARE PARTS SUB-TABLE */}
          <div className="rounded-lg border border-border bg-table-header p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary-base" /> Pièces Détachées Consommées (Sortie Stock)
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ piece_id: "", quantite: 1 })}
                className="text-xs border-border h-7 bg-background"
              >
                <Plus className="h-3 w-3 mr-1" /> + Ajouter une pièce
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-[11px] text-text-secondary italic">
                Aucune pièce détachée prélevée du stock pour cette intervention (main-d&apos;œuvre seule).
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        {...register(`pieces_utilisees.${index}.piece_id` as const)}
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                      >
                        <option value="">Sélectionner une pièce du magasin...</option>
                        {pieces.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock_actuel <= 0}>
                            [{p.reference}] {p.designation} — Dispo: {p.stock_actuel} {p.unite}(s) {p.stock_actuel <= 0 ? "(RUPTURE)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qté"
                        {...register(`pieces_utilisees.${index}.quantite` as const, { valueAsNumber: true })}
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-danger hover:bg-danger-bg h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Coût Total (DZD)</label>
              <input
                type="number"
                step="500"
                {...register("cout_total", { valueAsNumber: true })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Statut OT</label>
              <select
                {...register("statut")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="TERMINEE">🟢 Travaux Terminés (Véhicule Prêt)</option>
                <option value="EN_COURS">🟠 En Cours (Véhicule Immobilisé)</option>
                <option value="PLANIFIEE">🟡 Planifiée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Prochain Contrôle (KM)</label>
              <input
                type="number"
                {...register("prochain_kilo_maintenance", { valueAsNumber: true })}
                placeholder="260000"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
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
              {isSubmitting ? "Validation & Sortie Stock..." : "Enregistrer l'intervention"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
