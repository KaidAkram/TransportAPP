"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  telephone: z.string().regex(/^[\d\s\-\+\(\)]*$/, "Format invalide").or(z.literal("")).optional().nullable(),
  email: z.string().email("Email invalide").or(z.literal("")).optional().nullable(),
  whatsapp: z.string().regex(/^[\d\s\-\+\(\)]*$/, "Format invalide").or(z.literal("")).optional().nullable(),
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

// Reusable glass input class
const glassInput = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all";
const glassInputMono = `${glassInput} font-mono`;
const glassSelect = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all appearance-none cursor-pointer [color-scheme:dark]";
const glassLabel = "block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2";

export function AddContactModal({
  partenaireId,
  isOpen,
  onClose,
  onSuccess,
}: AddContactModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(131,77,251,0.05), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Ajouter un Interlocuteur</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mt-0.5">Nouveau contact au sein de l&apos;entreprise</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="relative p-6 space-y-5 overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 p-4 border border-rose-500/20">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span className="text-xs text-rose-200 font-medium">{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={glassLabel}>Nom <span className="text-rose-400">*</span></label>
              <input
                {...register("nom")}
                placeholder="ex: Benali"
                className={glassInput}
              />
              {errors.nom && <p className="text-[11px] text-rose-400 mt-1">{errors.nom.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>Prénom <span className="text-rose-400">*</span></label>
              <input
                {...register("prenom")}
                placeholder="ex: Amina"
                className={glassInput}
              />
              {errors.prenom && <p className="text-[11px] text-rose-400 mt-1">{errors.prenom.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>Fonction / Titre</label>
              <input
                {...register("fonction")}
                placeholder="ex: Directrice Financière, Responsable Transport"
                className={glassInput}
              />
            </div>

            <div>
              <label className={glassLabel}>Téléphone Direct</label>
              <input
                {...register("telephone")}
                placeholder="ex: 0550 12 34 56"
                className={glassInputMono}
              />
              {errors.telephone && <p className="text-[11px] text-rose-400 mt-1">{errors.telephone.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>Email</label>
              <input
                {...register("email")}
                placeholder="ex: amina.b@entreprise.dz"
                className={glassInput}
              />
              {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("est_principal")}
                className="h-4 w-4 rounded border-white/10 text-[var(--color-electric-violet)] focus:ring-[var(--color-electric-violet)] bg-white/5"
              />
              <span className="text-xs font-medium text-white">
                Définir comme Contact Principal pour ce partenaire
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-[var(--color-electric-violet)] rounded-xl hover:bg-[var(--color-electric-violet)]/80 shadow-[0_0_20px_rgba(131,77,251,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Enregistrement..." : "Ajouter le contact"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
