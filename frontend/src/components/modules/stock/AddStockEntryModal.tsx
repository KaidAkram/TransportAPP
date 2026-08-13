"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowDownRight, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Piece } from "@/types/stock";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";

const entrySchema = z.object({
  piece_id: z.string().min(1, "Veuillez sélectionner la pièce livrée"),
  quantite: z.number().min(1, "La quantité livrée doit être supérieure à zéro"),
  fournisseur_id: z.string().optional().nullable(),
  date: z.string().min(1, "La date de livraison est requise"),
  motif: z.string().min(3, "Le motif est requis"),
  reference_document: z.string().optional().nullable(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

interface AddStockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPiece?: Piece | null;
  piecesList?: Piece[];
}

export function AddStockEntryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultPiece,
  piecesList = [],
}: AddStockEntryModalProps) {
  const [suppliers, setSuppliers] = useState<Partenaire[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      quantite: 1,
      date: new Date().toISOString().split("T")[0],
      motif: "Réception commande magasin",
      piece_id: defaultPiece?.id || "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      api
        .get<PartenaireListResponse>("/partenaires", { role_partenaire: "FOURNISSEUR", per_page: "100" })
        .then((res) => setSuppliers(res.data.items))
        .catch(console.error);

      if (defaultPiece) {
        setValue("piece_id", defaultPiece.id);
      }
    }
  }, [isOpen, defaultPiece, setValue]);

  if (!isOpen) return null;

  const onSubmit = async (data: EntryFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      await api.post("/stock/entrees", {
        ...data,
        quantite: Number(data.quantite),
        fournisseur_id: data.fournisseur_id || null,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'enregistrement de l'entrée de stock.");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-bg text-success">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Réception Livraison Fournisseur</h2>
              <p className="text-xs text-text-secondary">Entrée de pièces détachées & incrémentation du stock</p>
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

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Article / Pièce à réceptionner *
            </label>
            <select
              {...register("piece_id")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            >
              <option value="">Sélectionner une référence...</option>
              {piecesList.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.reference}] {p.designation} (Stock actuel: {p.stock_actuel} {p.unite})
                </option>
              ))}
            </select>
            {errors.piece_id && (
              <p className="text-[11px] text-danger mt-1">{errors.piece_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Quantité Livrée *
              </label>
              <input
                type="number"
                min="1"
                {...register("quantite", { valueAsNumber: true })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.quantite && (
                <p className="text-[11px] text-danger mt-1">{errors.quantite.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date de Réception *
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Fournisseur
            </label>
            <select
              {...register("fournisseur_id")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            >
              <option value="">Fournisseur non spécifié / Stock interne</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom_commercial}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                N° Bon de Livraison (BL)
              </label>
              <input
                {...register("reference_document")}
                placeholder="ex: BL-2026-089"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Motif de Réception
              </label>
              <input
                {...register("motif")}
                placeholder="ex: Réapprovisionnement régulier"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
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
              className="text-xs bg-success hover:bg-success/90 text-white"
            >
              {isSubmitting ? "Validation..." : "Valider l'entrée de stock"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
