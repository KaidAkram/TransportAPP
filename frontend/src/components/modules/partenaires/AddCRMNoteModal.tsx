"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageSquare, X, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CRMNote } from "@/types/partenaire";
import { GlassSelect } from "@/components/ui/GlassSelect";

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

// Reusable glass input class
const glassInput = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all";
const glassInputMono = `${glassInput} font-mono`;
const glassSelect = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all appearance-none cursor-pointer [color-scheme:dark]";
const glassLabel = "block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2";

export function AddCRMNoteModal({
  partenaireId,
  isOpen,
  onClose,
  onSuccess,
}: AddCRMNoteModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    control,
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

  if (!isOpen || !mounted) return null;

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
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Consigner une Interaction CRM</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mt-0.5">Appel, Réunion, Email ou Note interne</p>
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
              <label className={glassLabel}>
                Type d&apos;Échange <span className="text-rose-400">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "Appel", label: "Appel Téléphonique" },
                      { value: "Réunion", label: "Réunion / Négociation" },
                      { value: "Email", label: "Email Commercial" },
                      { value: "Note", label: "Note Interne" },
                    ]}
                  />
                )}
              />
            </div>

            <div>
              <label className={glassLabel}>Date <span className="text-rose-400">*</span></label>
              <input
                type="date"
                {...register("date")}
                className={glassInput}
              />
              {errors.date && <p className="text-[11px] text-rose-400 mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div>
            <label className={glassLabel}>Auteur de la note</label>
            <input
              {...register("auteur")}
              placeholder="ex: Rachid (Responsable Commercial)"
              className={glassInput}
            />
          </div>

          <div>
            <label className={glassLabel}>
              Compte-rendu de l&apos;échange <span className="text-rose-400">*</span>
            </label>
            <textarea
              {...register("contenu")}
              rows={4}
              placeholder="Résumez les points abordés, les besoins exprimés par le client et les prochaines actions..."
              className={glassInput}
            />
            {errors.contenu && <p className="text-[11px] text-rose-400 mt-1">{errors.contenu.message}</p>}
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer la note"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
