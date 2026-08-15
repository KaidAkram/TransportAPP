"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowDownRight, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Piece } from "@/types/stock";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";

const entrySchema = z.object({
  piece_id: z.string().min(1, "Veuillez sélectionner la pièce livrée"),
  quantite: z.number().min(1, "La quantité livrée doit être supérieure à zéro"),
  fournisseur_id: z.string().optional().nullable(),
  date: z.string().min(1, "La date de livraison est requise"),
  motif: z.string().min(3, "Le motif est requis"),
  reference_document: z.string().optional().nullable(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

interface AddStockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPiece?: Piece | null;
  piecesList?: Piece[];
}

export function AddStockEntryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultPiece,
  piecesList = [],
}: AddStockEntryModalProps) {
  const [mounted, setMounted] = useState(false);
  const [suppliers, setSuppliers] = useState<Partenaire[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState<EntryFormValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      quantite: 1,
      date: new Date().toISOString().split("T")[0],
      motif: "Réception commande magasin",
      piece_id: defaultPiece?.id || "",
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      api
        .get<PartenaireListResponse>("/partenaires", { role_partenaire: "FOURNISSEUR", per_page: "100" })
        .then((res) => setSuppliers(res.data.items))
        .catch(console.error);

      if (defaultPiece) {
        setValue("piece_id", defaultPiece.id);
      }
    } else {
      document.body.style.overflow = "unset";
      setIsConfirming(false);
      setServerError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, defaultPiece, setValue]);

  if (!mounted || !isOpen) return null;

  const onSubmit = (data: EntryFormValues) => {
    setFormData(data);
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    try {
      setIsSubmitting(true);
      setServerError(null);

      await api.post("/stock/entrees", {
        ...formData,
        quantite: Number(formData.quantite),
        fournisseur_id: formData.fournisseur_id || null,
      });

      reset();
      setIsConfirming(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'enregistrement de l'entrée de stock.");
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPiece = formData ? piecesList.find(p => p.id === formData.piece_id) : (defaultPiece || null);
  const selectedSupplier = formData && formData.fournisseur_id ? suppliers.find(s => s.id === formData.fournisseur_id) : null;

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass = "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Subtle Background Glow inside Modal */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] pointer-events-none rounded-full transition-colors duration-500 ${isConfirming ? 'bg-[var(--color-turbo)]/15' : 'bg-emerald-500/10'}`} />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              isConfirming ? 'bg-[var(--color-turbo)]/10 border-[var(--color-turbo)]/20 text-[var(--color-turbo)]' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                {isConfirming ? "Vérification Requise" : "Réception Fournisseur"}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {isConfirming 
                  ? "Veuillez confirmer les informations d'entrée" 
                  : "Entrée de pièces détachées & incrémentation du stock"}
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
            <form id="add-entry-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Article / Pièce *</label>
                  <Controller
                    name="piece_id"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Sélectionner une pièce..." },
                          ...(defaultPiece ? [{ value: defaultPiece.id, label: `${defaultPiece.reference} - ${defaultPiece.designation}` }] : piecesList.map(p => ({ value: p.id, label: `${p.reference} - ${p.designation}` })))
                        ]}
                      />
                    )}
                  />
                  {errors.piece_id && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.piece_id.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Fournisseur</label>
                  <Controller
                    name="fournisseur_id"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Sans fournisseur (Ajustement libre)" },
                          ...suppliers.map(s => ({ value: s.id, label: s.nom_commercial || s.id }))
                        ]}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Quantité Reçue *</label>
                  <Controller
                    name="quantite"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={1}
                        suffix={selectedPiece ? selectedPiece.unite : ""}
                      />
                    )}
                  />
                  {errors.quantite && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.quantite.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Date Réception *</label>
                  <input
                    type="date"
                    {...register("date")}
                    className={inputClass}
                  />
                  {errors.date && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.date.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Document Réf.</label>
                  <input
                    {...register("reference_document")}
                    placeholder="ex: BL-2026-987"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Motif / Remarque *</label>
                <input
                  {...register("motif")}
                  placeholder="Réception commande fournisseur..."
                  className={inputClass}
                />
                {errors.motif && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.motif.message}</p>}
              </div>

              {selectedPiece && (
                <div className="mt-4 p-4 rounded-xl border border-[var(--color-electric-violet)]/20 bg-[var(--color-electric-violet)]/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-electric-violet)]">Stock Actuel</p>
                    <p className="text-sm font-bold text-white font-mono">{selectedPiece.stock_actuel} {selectedPiece.unite}(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Nouveau Stock Estimé</p>
                    <p className="text-sm font-bold text-white font-mono">{selectedPiece.stock_actuel + (Number(formData?.quantite) || 0)} {selectedPiece.unite}(s)</p>
                  </div>
                </div>
              )}

            </form>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="rounded-xl border border-[var(--color-turbo)]/20 bg-[var(--color-turbo)]/5 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--color-turbo)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">
                    Nouvelle Réception : <span className="font-mono text-[var(--color-turbo)]">{selectedPiece?.reference}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Veuillez confirmer l'ajout de ces pièces au stock magasin.
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
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-500/70 mb-1">Quantité Entrante</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">
                    + {formData?.quantite} {selectedPiece?.unite}(s)
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Fournisseur</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedSupplier?.nom_commercial || "Non spécifié"}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Date</p>
                  <p className="text-sm font-semibold text-white font-mono">
                    {new Date(formData?.date || "").toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Référence BL/Facture</p>
                  <p className="text-sm font-semibold text-white font-mono">
                    {formData?.reference_document || "Aucune réf."}
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
              Continuer <ArrowDownRight className="h-3.5 w-3.5" />
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
                <>Valider la réception <CheckCircle2 className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
