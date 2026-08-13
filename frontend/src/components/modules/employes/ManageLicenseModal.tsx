"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Permis } from "@/types/employe";

const licenseSchema = z.object({
  numero: z.string().min(4, "Le numéro de permis est requis"),
  categories: z.string().min(1, "Au moins une catégorie est requise (ex: B, D, D1)"),
  date_obtention: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
  scan_permis: z.string().optional().nullable(),
});

type LicenseFormValues = z.infer<typeof licenseSchema>;

interface ManageLicenseModalProps {
  chauffeurId: string;
  existingPermis?: Permis | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPermis: Permis) => void;
}

export function ManageLicenseModal({
  chauffeurId,
  existingPermis,
  isOpen,
  onClose,
  onSuccess,
}: ManageLicenseModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      numero: existingPermis?.numero || "",
      categories: existingPermis?.categories || "B, D, D1",
      date_obtention: existingPermis?.date_obtention || null,
      date_expiration: existingPermis?.date_expiration || null,
      scan_permis: existingPermis?.scan_permis || "/assets/documents/permis.pdf",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: LicenseFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<Permis>(`/employes/${chauffeurId}/permis`, {
        ...data,
        date_obtention: data.date_obtention || null,
        date_expiration: data.date_expiration || null,
      });

      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la mise à jour du permis.");
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
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Permis de Conduire</h2>
              <p className="text-xs text-text-secondary">Enregistrement et suivi des dates de validité</p>
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
              Numéro de Permis *
            </label>
            <input
              {...register("numero")}
              placeholder="ex: DZ-31-987654"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.numero && <p className="text-[11px] text-danger mt-1">{errors.numero.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Catégories Validées (ex: B, D, D1, CE) *
            </label>
            <input
              {...register("categories")}
              placeholder="ex: B, D, D1"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.categories && <p className="text-[11px] text-danger mt-1">{errors.categories.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date d&apos;obtention
              </label>
              <input
                type="date"
                {...register("date_obtention")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date d&apos;expiration
              </label>
              <input
                type="date"
                {...register("date_expiration")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Chemin / URL du scan PDF
            </label>
            <input
              {...register("scan_permis")}
              placeholder="/assets/documents/permis_scan.pdf"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer le permis"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
