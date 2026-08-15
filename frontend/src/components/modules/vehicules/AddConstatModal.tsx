"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertTriangle, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ConstatSummary } from "@/types/vehicule";

const constatSchema = z.object({
  date: z.string().min(1, "La date de l'incident est requise"),
  heure: z.string().optional().nullable(),
  lieu: z.string().min(3, "Le lieu de l'accident est requis"),
  circonstances: z.string().min(5, "Les circonstances doivent être détaillées"),
  dommages: z.string().min(3, "La description des dommages est requise"),
  tiers_implique: z.boolean(),
  infos_tiers: z.string().optional().nullable(),
});

type ConstatFormValues = z.infer<typeof constatSchema>;

interface AddConstatModalProps {
  vehiculeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newConstat: ConstatSummary) => void;
}

export function AddConstatModal({ vehiculeId, isOpen, onClose, onSuccess }: AddConstatModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ConstatFormValues>({
    resolver: zodResolver(constatSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      tiers_implique: false,
    },
  });

  const tiersImplique = watch("tiers_implique");

  if (!isOpen) return null;

  const onSubmit = async (data: ConstatFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const res = await api.post<ConstatSummary>(`/vehicules/${vehiculeId}/constats`, {
        ...data,
        vehicule_id: vehiculeId,
        heure: data.heure || null,
        infos_tiers: data.infos_tiers || null,
      });
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la déclaration du constat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(244,63,94,0.05), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Déclarer un Constat d&apos;Accident</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-rose-300/70 mt-0.5">Enregistrement d&apos;un sinistre ou dommage matériel</p>
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
            <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 p-4 border border-rose-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span className="text-xs text-rose-200 font-medium">{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                Date de l&apos;accident <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white/10 transition-all [color-scheme:dark]"
              />
              {errors.date && <p className="text-[11px] text-rose-400 mt-1.5">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                Heure approximative
              </label>
              <input
                type="text"
                {...register("heure")}
                placeholder="ex: 14h30"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
              Lieu précis du sinistre <span className="text-rose-400">*</span>
            </label>
            <input
              {...register("lieu")}
              placeholder="ex: RN4 PK 28, Sortie Oued Tlelat, Oran"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white/10 transition-all"
            />
            {errors.lieu && <p className="text-[11px] text-rose-400 mt-1.5">{errors.lieu.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
              Circonstances de l&apos;accident <span className="text-rose-400">*</span>
            </label>
            <textarea
              {...register("circonstances")}
              rows={3}
              placeholder="Décrivez précisément les faits, la météo, la vitesse et le comportement des véhicules..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white/10 transition-all resize-none"
            />
            {errors.circonstances && <p className="text-[11px] text-rose-400 mt-1.5">{errors.circonstances.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
              Dommages matériels constatés <span className="text-rose-400">*</span>
            </label>
            <textarea
              {...register("dommages")}
              rows={2}
              placeholder="ex: Rétroviseur droit brisé, aile avant droite froissée, pare-chocs fissuré..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white/10 transition-all resize-none"
            />
            {errors.dommages && <p className="text-[11px] text-rose-400 mt-1.5">{errors.dommages.message}</p>}
          </div>

          {/* Tiers Impliqué Checkbox */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  {...register("tiers_implique")}
                  className="peer appearance-none h-5 w-5 rounded-md border-2 border-white/20 bg-white/5 checked:bg-rose-500 checked:border-rose-500 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                Un tiers ou autre véhicule est impliqué dans l&apos;accident
              </span>
            </label>

            {tiersImplique && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mb-2">
                  Informations sur le tiers
                </label>
                <textarea
                  {...register("infos_tiers")}
                  rows={2}
                  placeholder="Nom du conducteur, Immatriculation, Compagnie d'assurance et n° de police..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white/10 transition-all resize-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer le constat"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
