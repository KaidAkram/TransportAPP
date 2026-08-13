"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Piece } from "@/types/stock";

const pieceSchema = z.object({
  reference: z.string().min(2, "La référence magasin est requise (ex: FIL-001)"),
  designation: z.string().min(3, "La désignation est requise"),
  categorie: z.string().min(1, "La catégorie est requise"),
  marque: z.string().optional().nullable(),
  modele_compatibilite: z.string().optional().nullable(),
  unite: z.string(),
  stock_actuel: z.number().min(0, "Le stock initial doit être positif"),
  stock_minimum: z.number().min(0, "Le seuil d'alerte doit être positif"),
  emplacement: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type PieceFormValues = z.infer<typeof pieceSchema>;

interface AddPieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPiece: Piece) => void;
}

export function AddPieceModal({ isOpen, onClose, onSuccess }: AddPieceModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PieceFormValues>({
    resolver: zodResolver(pieceSchema),
    defaultValues: {
      unite: "Pièce",
      categorie: "Filtres",
      stock_actuel: 0,
      stock_minimum: 5,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: PieceFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<Piece>("/stock/pieces", {
        ...data,
        stock_actuel: Number(data.stock_actuel),
        stock_minimum: Number(data.stock_minimum),
      });

      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de la référence magasin.");
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
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nouvelle Pièce Détachée</h2>
              <p className="text-xs text-text-secondary">Enregistrement d&apos;un article au catalogue magasin</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Référence Article *
              </label>
              <input
                {...register("reference")}
                placeholder="ex: FIL-001"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.reference && (
                <p className="text-[11px] text-danger mt-1">{errors.reference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Catégorie *
              </label>
              <select
                {...register("categorie")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="Filtres">Filtres (Huile, Air, Carburant)</option>
                <option value="Freinage">Freinage (Plaquettes, Disques, Valvules)</option>
                <option value="Moteur">Moteur & Courroies</option>
                <option value="Pneumatiques">Pneumatiques & Jantes</option>
                <option value="Électricité">Électricité & Batteries</option>
                <option value="Lubrifiants">Lubrifiants & Liquides de Refroidissement</option>
                <option value="Suspension">Suspension & Direction</option>
                <option value="Autre">Autre Fourniture Atelier</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Désignation Complète *
            </label>
            <input
              {...register("designation")}
              placeholder="ex: Filtre à huile Mercedes Tourismo OM470 Euro 6"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.designation && (
              <p className="text-[11px] text-danger mt-1">{errors.designation.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Marque / Fabricant</label>
              <input
                {...register("marque")}
                placeholder="ex: Mann-Filter, Bosch, Knorr-Bremse"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Unité de Mesure</label>
              <select
                {...register("unite")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="Pièce">Pièce</option>
                <option value="Jeu">Jeu / Kit</option>
                <option value="Litre">Litre</option>
                <option value="Paquet">Paquet / Carton</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Stock Initial</label>
              <input
                type="number"
                {...register("stock_actuel", { valueAsNumber: true })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Seuil Alerte (Min)</label>
              <input
                type="number"
                {...register("stock_minimum", { valueAsNumber: true })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Emplacement</label>
              <input
                {...register("emplacement")}
                placeholder="A-03-02"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono uppercase text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Modèles Compatibles</label>
            <input
              {...register("modele_compatibilite")}
              placeholder="ex: Mercedes Tourismo, Travego, Iveco Crossway"
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
              {isSubmitting ? "Création..." : "Ajouter la référence"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
