"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DocumentSummary } from "@/types/vehicule";

const documentSchema = z.object({
  nom: z.string().min(2, "Le nom du document est requis"),
  type: z.string().min(2, "Le type de document est requis"),
  url_fichier: z.string().min(2, "L'URL ou chemin du document est requis"),
  date_emission: z.string().optional().nullable(),
  date_expiration: z.string().optional().nullable(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface AddDocumentModalProps {
  vehiculeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: DocumentSummary) => void;
}

export function AddDocumentModal({ vehiculeId, isOpen, onClose, onSuccess }: AddDocumentModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: "Assurance",
      url_fichier: "/assets/documents/document_vehicule.pdf",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: DocumentFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const res = await api.post<DocumentSummary>(`/vehicules/${vehiculeId}/documents`, {
        ...data,
        date_emission: data.date_emission || null,
        date_expiration: data.date_expiration || null,
        entity_type: "vehicule",
        entity_id: vehiculeId,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-table-header">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Ajouter un Document</h2>
              <p className="text-xs text-text-secondary">Assurance, Carte grise, Contrôle technique</p>
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
              Type de document *
            </label>
            <select
              {...register("type")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            >
              <option value="Assurance">Assurance</option>
              <option value="Contrôle technique">Contrôle technique</option>
              <option value="Carte grise">Carte grise</option>
              <option value="Vignette automobile">Vignette automobile</option>
              <option value="Autre">Autre document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Intitulé du document *
            </label>
            <input
              {...register("nom")}
              placeholder="ex: Police Assurance Flotte 2026-2027"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.nom && <p className="text-[11px] text-danger mt-1">{errors.nom.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date d&apos;émission
              </label>
              <input
                type="date"
                {...register("date_emission")}
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
              Chemin / URL du fichier
            </label>
            <input
              {...register("url_fichier")}
              placeholder="/assets/documents/doc.pdf"
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer le document"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
