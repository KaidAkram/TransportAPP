"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Piece } from "@/types/stock";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";

const pieceSchema = z.object({
  reference: z.string().min(2, "La référence magasin est requise (ex: FIL-001)"),
  designation: z.string().min(3, "La désignation est requise"),
  categorie: z.string().min(1, "La catégorie est requise"),
  marque: z.string().optional().nullable(),
  modele_compatibilite: z.string().optional().nullable(),
  unite: z.string(),
  stock_actuel: z.coerce.number().min(0, "Le stock initial doit être positif"),
  stock_minimum: z.coerce.number().min(0, "Le seuil d'alerte doit être positif"),
  emplacement: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type PieceFormValues = z.infer<typeof pieceSchema>;

interface AddPieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPiece: Piece) => void;
}

export function AddPieceModal({ isOpen, onClose, onSuccess }: AddPieceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState<PieceFormValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PieceFormValues>({
    resolver: zodResolver(pieceSchema),
    defaultValues: {
      unite: "Pièce",
      categorie: "Filtres",
      stock_actuel: 0,
      stock_minimum: 5,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      api
        .get("/utils/next-sequence", { entity: "piece" })
        .then((res: any) => {
          if (res.data?.next) setValue("reference", res.data.next);
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
  }, [isOpen]);

  const watchUnite = watch("unite");

  if (!mounted || !isOpen) return null;

  const onSubmit = (data: PieceFormValues) => {
    setFormData(data);
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<Piece>("/stock/pieces", {
        ...formData,
        stock_actuel: Number(formData.stock_actuel),
        stock_minimum: Number(formData.stock_minimum),
      });

      reset();
      setIsConfirming(false);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de la référence magasin.");
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass = "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Subtle Background Glow inside Modal */}
        <div className={`absolute top-0 end-0 w-64 h-64 blur-[80px] pointer-events-none rounded-full transition-colors duration-500 ${isConfirming ? 'bg-[var(--color-electric-violet)]/15' : 'bg-emerald-500/10'}`} />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              isConfirming ? 'bg-[var(--color-electric-violet)]/10 border-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)]' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                {isConfirming ? "Confirmation du Nouvel Article" : "Nouvelle Pièce Détachée"}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {isConfirming 
                  ? "Veuillez vérifier les informations de stock" 
                  : "Enregistrement d'un article au catalogue magasin"}
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto relative z-10 flex-1 custom-scrollbar">
          {!isConfirming ? (
            <form id="add-piece-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Référence Magasin *</label>
                  <input
                    {...register("reference")}
                    placeholder="ex: FIL-001"
                    className={`${inputClass} font-mono font-bold text-[var(--color-electric-violet)]`}
                  />
                  {errors.reference && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.reference.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Catégorie *</label>
                  <Controller
                    name="categorie"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "Filtres", label: "Filtres (Huile, Air, Carburant)" },
                          { value: "Freinage", label: "Freinage (Plaquettes, Disques)" },
                          { value: "Moteur", label: "Moteur & Courroies" },
                          { value: "Pneumatiques", label: "Pneumatiques & Jantes" },
                          { value: "Électricité", label: "Électricité & Batteries" },
                          { value: "Lubrifiants", label: "Lubrifiants & Liquides" },
                          { value: "Suspension", label: "Suspension & Direction" },
                          { value: "Autre", label: "Autre Fourniture Atelier" },
                        ]}
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Désignation Complète *</label>
                <input
                  {...register("designation")}
                  placeholder="ex: Filtre à huile Mercedes Tourismo OM470 Euro 6"
                  className={inputClass}
                />
                {errors.designation && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.designation.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Marque / Fabricant</label>
                  <input
                    {...register("marque")}
                    placeholder="ex: Mann-Filter, Bosch..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Modèles Compatibles</label>
                  <input
                    {...register("modele_compatibilite")}
                    placeholder="ex: Mercedes, MAN, Scania..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Stock Initial</label>
                  <Controller
                    name="stock_actuel"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        step="any"
                        suffix={watchUnite} // Ideally we'd watch this but let's just keep it simple
                      />
                    )}
                  />
                  {errors.stock_actuel && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.stock_actuel.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Seuil d'Alerte (Min)</label>
                  <Controller
                    name="stock_minimum"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        step="any"
                      />
                    )}
                  />
                  {errors.stock_minimum && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.stock_minimum.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Unité de mesure</label>
                  <Controller
                    name="unite"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "Pièce", label: "Pièce(s)" },
                          { value: "Litre", label: "Litre(s)" },
                          { value: "Kg", label: "Kilogramme(s)" },
                          { value: "Lot", label: "Lot(s)" },
                        ]}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Emplacement Magasin</label>
                  <input
                    {...register("emplacement")}
                    placeholder="ex: Rayon A, Étagère 3"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Notes / Description</label>
                  <input
                    {...register("description")}
                    placeholder="Informations supplémentaires..."
                    className={inputClass}
                  />
                </div>
              </div>
            </form>
          ) : (
            /* Confirm Screen */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="rounded-xl border border-[var(--color-electric-violet)]/20 bg-[var(--color-electric-violet)]/5 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--color-electric-violet)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">
                    Création de l'article : <span className="font-mono text-[var(--color-electric-violet)]">{formData?.reference}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Cet article sera ajouté au catalogue. Vérifiez les seuils de stock initialement définis.
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
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Catégorie & Marque</p>
                  <p className="text-sm font-semibold text-white">
                    {formData?.categorie} — {formData?.marque || "Sans marque"}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Désignation</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {formData?.designation}
                  </p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-500/70 mb-1">Stock Initial</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">
                    {formData?.stock_actuel} {formData?.unite}(s)
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Seuil Alerte</p>
                  <p className="text-sm font-semibold text-white font-mono">
                    &le; {formData?.stock_minimum} {formData?.unite}(s)
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
              className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
            >
              Continuer <Package className="h-3.5 w-3.5" />
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
                <>Confirmer l'ajout <CheckCircle2 className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
