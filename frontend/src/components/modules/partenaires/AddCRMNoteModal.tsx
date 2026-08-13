"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageSquare, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CRMNote } from "@/types/partenaire";

const noteSchema = z.object({
  type: z.string().min(1, "Le type d'interaction est requis"),
  auteur: z.string().min(2, "Le nom de l'auteur est requis"),
  date: z.string().min(1, "La date est requise"),
  contenu: z.string().min(5, "Le compte-rendu doit être explicite"),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface AddCRMNoteModalProps {
  partenaireId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newNote: CRMNote) => void;
}

export function AddCRMNoteModal({
  partenaireId,
  isOpen,
  onClose,
  onSuccess,
}: AddCRMNoteModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      type: "Appel",
      auteur: "Commercial ERP",
      date: new Date().toISOString().split("T")[0],
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: NoteFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<CRMNote>(`/partenaires/${partenaireId}/notes`, data);
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'enregistrement de la note CRM.");
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
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Consigner une Interaction CRM</h2>
              <p className="text-xs text-text-secondary">Appel, Réunion, Email ou Note interne</p>
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
                Type d&apos;Échange *
              </label>
              <select
                {...register("type")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="Appel">📞 Appel Téléphonique</option>
                <option value="Réunion">🤝 Réunion / Négociation</option>
                <option value="Email">✉️ Email Commercial</option>
                <option value="Note">📝 Note Interne</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Date *</label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.date && <p className="text-[11px] text-danger mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Auteur de la note</label>
            <input
              {...register("auteur")}
              placeholder="ex: Rachid (Responsable Commercial)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Compte-rendu de l&apos;échange *
            </label>
            <textarea
              {...register("contenu")}
              rows={4}
              placeholder="Résumez les points abordés, les besoins exprimés par le client et les prochaines actions..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
            {errors.contenu && <p className="text-[11px] text-danger mt-1">{errors.contenu.message}</p>}
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer la note"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
