"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ClipboardCheck, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Piece } from "@/types/stock";

const auditSchema = z.object({
  piece_id: z.string().min(1, "Veuillez sélectionner la pièce"),
  stock_reel_compte: z.number().min(0, "Le stock physique doit être supérieur ou égal à zéro"),
  date: z.string().min(1, "La date de comptage est requise"),
  motif: z.string().min(3, "Le motif est requis"),
  justification_ecart: z.string().optional().nullable(),
});

type AuditFormValues = z.infer<typeof auditSchema>;

interface InventoryAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  piece: Piece | null;
}

export function InventoryAuditModal({
  isOpen,
  onClose,
  onSuccess,
  piece,
}: InventoryAuditModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      piece_id: piece?.id || "",
      stock_reel_compte: piece?.stock_actuel || 0,
      date: new Date().toISOString().split("T")[0],
      motif: "Inventaire physique périodique",
    },
  });

  const countedStock = watch("stock_reel_compte");
  const theoreticalStock = piece?.stock_actuel || 0;
  const delta = (countedStock || 0) - theoreticalStock;

  if (!isOpen || !piece) return null;

  const onSubmit = async (data: AuditFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      await api.post("/stock/inventaire", {
        piece_id: piece.id,
        stock_reel_compte: Number(data.stock_reel_compte),
        date: data.date,
        motif: data.motif,
        justification_ecart: data.justification_ecart || null,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la validation de l'inventaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-table-header">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-bg text-warning">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Ajustement Inventaire Physique</h2>
              <p className="text-xs text-text-secondary">{piece.reference} — {piece.designation}</p>
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

          {/* Current vs Counted Box */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-border bg-table-header text-center">
            <div>
              <p className="text-[10px] text-text-secondary uppercase">Stock Théorique</p>
              <p className="text-sm font-bold font-mono text-text-primary mt-1">
                {theoreticalStock} {piece.unite}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase">Comptage Réel</p>
              <p className="text-sm font-bold font-mono text-primary-base mt-1">
                {countedStock || 0} {piece.unite}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase">Écart Constaté</p>
              <p
                className={`text-sm font-bold font-mono mt-1 ${
                  delta === 0
                    ? "text-success"
                    : delta > 0
                    ? "text-primary-base"
                    : "text-danger"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} {piece.unite}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Stock Physique Réel *
              </label>
              <input
                type="number"
                min="0"
                {...register("stock_reel_compte", { valueAsNumber: true })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.stock_reel_compte && (
                <p className="text-[11px] text-danger mt-1">{errors.stock_reel_compte.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date de Comptage *
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
              Motif de l&apos;Inventaire
            </label>
            <input
              {...register("motif")}
              placeholder="ex: Inventaire mensuel de clôture"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Justification de l&apos;Écart (si différent de 0)
            </label>
            <select
              {...register("justification_ecart")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            >
              <option value="">Aucun écart constaté</option>
              <option value="Perte ou casse atelier">Casse ou détérioration durant manipulation</option>
              <option value="Erreur de saisie précédente">Erreur de saisie / non scanné lors du BL précédent</option>
              <option value="Consommation d'urgence non déclarée">Consommation dépannage nuit non déclarée</option>
              <option value="Ajustement de régularisation">Autre régularisation</option>
            </select>
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
              className="text-xs bg-warning hover:bg-warning/90 text-white"
            >
              {isSubmitting ? "Enregistrement..." : "Valider l'ajustement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
