"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Contact } from "@/types/partenaire";

const contactSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  fonction: z.string().optional().nullable(),
  telephone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  est_principal: z.boolean(),
  notes: z.string().optional().nullable(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface AddContactModalProps {
  partenaireId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContact: Contact) => void;
}

export function AddContactModal({
  partenaireId,
  isOpen,
  onClose,
  onSuccess,
}: AddContactModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      est_principal: false,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<Contact>(`/partenaires/${partenaireId}/contacts`, data);
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'ajout du contact.");
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
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Ajouter un Interlocuteur</h2>
              <p className="text-xs text-text-secondary">Nouveau contact au sein de l&apos;entreprise</p>
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
              <label className="block text-xs font-semibold text-text-primary mb-1">Nom *</label>
              <input
                {...register("nom")}
                placeholder="ex: Benali"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.nom && <p className="text-[11px] text-danger mt-1">{errors.nom.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Prénom *</label>
              <input
                {...register("prenom")}
                placeholder="ex: Amina"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.prenom && <p className="text-[11px] text-danger mt-1">{errors.prenom.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Fonction / Titre</label>
            <input
              {...register("fonction")}
              placeholder="ex: Directrice Financière, Responsable Transport"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Téléphone Direct</label>
              <input
                {...register("telephone")}
                placeholder="ex: 0550 12 34 56"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Email</label>
              <input
                {...register("email")}
                placeholder="ex: amina.b@entreprise.dz"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("est_principal")}
                className="h-4 w-4 rounded border-border text-primary-base focus:ring-primary-base"
              />
              <span className="text-xs font-medium text-text-primary">
                Définir comme Contact Principal pour ce partenaire
              </span>
            </label>
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
              {isSubmitting ? "Enregistrement..." : "Ajouter le contact"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
