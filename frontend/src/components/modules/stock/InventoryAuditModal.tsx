"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ClipboardCheck, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Piece } from "@/types/stock";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";

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
  pieceId: string;
  pieceRef: string;
  pieceName: string;
}

export function InventoryAuditModal({
  isOpen,
  onClose,
  onSuccess,
  pieceId,
  pieceRef,
  pieceName,
}: InventoryAuditModalProps) {
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pieceDetails, setPieceDetails] = useState<Piece | null>(null);
  const [formData, setFormData] = useState<AuditFormValues | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      piece_id: pieceId,
      stock_reel_compte: 0,
      date: new Date().toISOString().split("T")[0],
      motif: "Inventaire physique périodique",
    },
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      api
        .get<Piece>(`/stock/pieces/${pieceId}`)
        .then((res) => {
          setPieceDetails(res.data);
          reset({
            piece_id: pieceId,
            stock_reel_compte: res.data.stock_actuel,
            date: new Date().toISOString().split("T")[0],
            motif: "Inventaire physique périodique",
          });
        })
        .catch(console.error);
    } else {
      document.body.style.overflow = "unset";
      setIsConfirming(false);
      setServerError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, pieceId, reset]);

  const countedStock = watch("stock_reel_compte");
  const theoreticalStock = pieceDetails?.stock_actuel || 0;
  const delta = (countedStock || 0) - theoreticalStock;

  if (!mounted || !isOpen || !pieceDetails) return null;

  const onSubmit = (data: AuditFormValues) => {
    setFormData(data);
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    try {
      setIsSubmitting(true);
      setServerError(null);

      await api.post("/stock/inventaire", {
        piece_id: pieceDetails.id,
        stock_reel_compte: Number(formData.stock_reel_compte),
        date: formData.date,
        motif: formData.motif,
        justification_ecart: formData.justification_ecart || null,
      });

      reset();
      setIsConfirming(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la validation de l'inventaire.");
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass = "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Subtle Background Glow inside Modal */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] pointer-events-none rounded-full transition-colors duration-500 ${isConfirming ? (delta < 0 ? 'bg-red-500/15' : 'bg-emerald-500/15') : 'bg-[var(--color-turbo)]/10'}`} />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              isConfirming ? (delta < 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400') : 'bg-[var(--color-turbo)]/10 border-[var(--color-turbo)]/20 text-[var(--color-turbo)]'
            }`}>
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                {isConfirming ? "Validation de l'Ajustement" : "Inventaire Physique"}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {pieceRef} — {pieceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto relative z-10 flex-1 custom-scrollbar">
          {!isConfirming ? (
            <form id="audit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Current vs Counted Box */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Stock Théorique</p>
                  <p className="text-sm font-bold font-mono text-white mt-1">
                    {theoreticalStock} {pieceDetails.unite}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Comptage Réel</p>
                  <p className="text-sm font-bold font-mono text-[var(--color-electric-violet)] mt-1">
                    {countedStock || 0} {pieceDetails.unite}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Écart</p>
                  <p
                    className={`text-sm font-bold font-mono mt-1 ${
                      delta === 0
                        ? "text-emerald-400"
                        : delta > 0
                        ? "text-[var(--color-electric-violet)]"
                        : "text-red-400"
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta} {pieceDetails.unite}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Stock Physique Réel *</label>
                  <Controller
                    name="stock_reel_compte"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        suffix={pieceDetails.unite}
                      />
                    )}
                  />
                  {errors.stock_reel_compte && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.stock_reel_compte.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Date de comptage *</label>
                  <input
                    type="date"
                    {...register("date")}
                    className={inputClass}
                  />
                  {errors.date && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.date.message}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Motif d'inventaire *</label>
                <input
                  {...register("motif")}
                  placeholder="Inventaire annuel, Contrôle inopiné..."
                  className={inputClass}
                />
                {errors.motif && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.motif.message}</p>}
              </div>

              {delta !== 0 && (
                <div className="animate-in fade-in duration-300">
                  <label className={labelClass}>Justification de l'écart</label>
                  <textarea
                    {...register("justification_ecart")}
                    placeholder="Explication de l'écart (perte, casse, erreur de saisie...)"
                    rows={2}
                    className={`${inputClass} resize-none border-red-500/30 focus:border-red-500`}
                  />
                </div>
              )}

            </form>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className={`rounded-xl border p-4 flex gap-3 ${delta < 0 ? 'bg-red-500/5 border-red-500/20' : delta > 0 ? 'bg-[var(--color-electric-violet)]/5 border-[var(--color-electric-violet)]/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${delta < 0 ? 'text-red-400' : delta > 0 ? 'text-[var(--color-electric-violet)]' : 'text-emerald-400'}`} />
                <div>
                  <p className="text-sm font-bold text-white">
                    Ajustement de stock pour : <span className="font-mono text-white/80">{pieceRef}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Le stock théorique passera de {theoreticalStock} à {formData?.stock_reel_compte}. Cet écart sera enregistré dans l'historique des mouvements.
                  </p>
                </div>
              </div>

              {serverError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Écart Constaté</p>
                  <p className={`text-xl font-bold font-mono ${
                      delta === 0
                        ? "text-emerald-400"
                        : delta > 0
                        ? "text-[var(--color-electric-violet)]"
                        : "text-red-400"
                    }`}>
                    {delta > 0 ? `+${delta}` : delta} {pieceDetails.unite}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Date</p>
                  <p className="text-sm font-semibold text-white font-mono">
                    {new Date(formData?.date || "").toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={isConfirming ? () => setIsConfirming(false) : onClose}
            className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            {isConfirming ? "Retour à l'édition" : "Annuler"}
          </button>
          
          {!isConfirming ? (
            <button
              type="button"
              onClick={() => handleSubmit(onSubmit)()}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-[var(--color-turbo)] text-[var(--color-haiti)] hover:bg-[#ca9a04] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center gap-2"
            >
              Continuer <ClipboardCheck className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#6A3DE8] hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] transition-all flex items-center gap-2 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                "Validation..."
              ) : (
                <>Confirmer l'ajustement <CheckCircle2 className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
