"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowDownRight, X, AlertCircle, CheckCircle2, Plus, Trash2, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Piece, Reception, ModeReglementReception } from "@/types/stock";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";

const ligneSchema = z.object({
  piece_id: z.string().min(1, "Sélectionnez une pièce"),
  quantite: z.coerce.number().min(1, "Qté > 0"),
  prix_unitaire: z.coerce.number().min(0.01, "Prix > 0"),
});

const receptionSchema = z.object({
  fournisseur_id: z.string().optional().nullable(),
  date: z.string().min(1, "Date requise"),
  lieu: z.string().optional(),
  mode_reglement: z.enum(["ESPECES", "CHEQUE", "VIREMENT", "CREDIT", "CCP"]),
  motif: z.string().optional(),
  reference_document: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, "Ajoutez au moins un article"),
});

type ReceptionFormValues = z.infer<typeof receptionSchema>;

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
  const [allPieces, setAllPieces] = useState<Piece[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<Reception | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReceptionFormValues>({
    resolver: zodResolver(receptionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      mode_reglement: "ESPECES",
      motif: "Réception commande magasin",
      lignes: defaultPiece
        ? [{ piece_id: defaultPiece.id, quantite: 1, prix_unitaire: 0 }]
        : [{ piece_id: "", quantite: 1, prix_unitaire: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lignes" });
  const watchLignes = watch("lignes");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      reset({
        date: new Date().toISOString().split("T")[0],
        mode_reglement: "ESPECES",
        motif: "Réception commande magasin",
        fournisseur_id: "",
        lieu: "",
        reference_document: "",
        lignes: defaultPiece
          ? [{ piece_id: defaultPiece.id, quantite: 1, prix_unitaire: 0 }]
          : [{ piece_id: "", quantite: 1, prix_unitaire: 0 }],
      });

      api
        .get<PartenaireListResponse>("/partenaires", { role_partenaire: "FOURNISSEUR", per_page: "100" })
        .then((res) => setSuppliers(res.data.items))
        .catch(console.error);
        
      api
        .get("/stock/pieces", { per_page: "1000" })
        .then((res: any) => setAllPieces(res.data.items || []))
        .catch(console.error);
    } else {
      document.body.style.overflow = "unset";
      setServerError(null);
      setSuccessData(null);
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen, defaultPiece, reset]);

  if (!mounted || !isOpen) return null;

  const montantTotal = (watchLignes || []).reduce(
    (sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0),
    0
  );

  const finalPieces = allPieces.length > 0 ? allPieces : piecesList;

  const pieceOptions = [
    { value: "", label: "Sélectionner..." },
    ...finalPieces.map((p) => ({
      value: p.id,
      label: `${p.reference} - ${p.designation}`,
    })),
  ];

  const modeOptions = [
    { value: "ESPECES", label: "Espèces" },
    { value: "CHEQUE", label: "Chèque" },
    { value: "VIREMENT", label: "Virement" },
    { value: "CREDIT", label: "Crédit" },
    { value: "CCP", label: "CCP" },
  ];

  const inputClass =
    "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass =
    "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const onSubmit = async (data: ReceptionFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        ...data,
        fournisseur_id: data.fournisseur_id || null,
        lieu: data.lieu || null,
        motif: data.motif || null,
        reference_document: data.reference_document || null,
        lignes: data.lignes.map((l) => ({
          piece_id: l.piece_id,
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire),
        })),
      };

      const res = await api.post<Reception>("/stock/receptions", payload);
      setSuccessData(res.data);
      reset();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de la réception.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] pointer-events-none rounded-full bg-emerald-500/15" />
          <div className="relative p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-heading font-extrabold text-white">Réception Enregistrée</h2>
            <p className="text-sm text-white/60 mt-1 font-mono">{successData.numero}</p>
            <p className="text-xs text-white/40 mt-2">
              {successData.montant_total.toLocaleString("fr-FR")} DA — {successData.mode_reglement}
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              {successData.url_pdf && (
                <a
                  href={successData.url_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#6c3ce0] transition-all"
                >
                  <Download className="h-3.5 w-3.5" /> Bon de Réception
                </a>
              )}
              <button
                onClick={() => { setSuccessData(null); onSuccess(); onClose(); }}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        <div className="absolute top-0 right-0 w-64 h-64 blur-[80px] pointer-events-none rounded-full bg-emerald-500/10" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">Réception Fournisseur</h2>
              <p className="text-xs text-white/50 mt-0.5">Bon de réception multi-articles avec suivi financier</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto relative z-10 flex-1 custom-scrollbar">
          <form id="reception-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Fournisseur + Date + Lieu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Fournisseur</label>
                <Controller name="fournisseur_id" control={control} render={({ field }) => (
                  <GlassSelect value={field.value || ""} onChange={field.onChange} options={[
                    { value: "", label: "Sans fournisseur" },
                    ...suppliers.map((s) => ({ value: s.id, label: s.nom_commercial || s.id })),
                  ]} />
                )} />
              </div>
              <div>
                <label className={labelClass}>Date Réception *</label>
                <input type="date" {...register("date")} className={inputClass} />
                {errors.date && <p className="mt-1 text-[11px] text-red-400">{errors.date.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Lieu</label>
                <input {...register("lieu")} placeholder="Ex: Magasin principal" className={inputClass} />
              </div>
            </div>

            {/* Mode règlement + Réf doc + Motif */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Mode de Règlement *</label>
                <Controller name="mode_reglement" control={control} render={({ field }) => (
                  <GlassSelect value={field.value} onChange={field.onChange} options={modeOptions} />
                )} />
              </div>
              <div>
                <label className={labelClass}>Réf. Document (BL)</label>
                <input {...register("reference_document")} placeholder="ex: BL-2026-001" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Motif</label>
                <input {...register("motif")} placeholder="Réception commande..." className={inputClass} />
              </div>
            </div>

            {/* Articles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>Articles Reçus *</label>
                <button
                  type="button"
                  onClick={() => append({ piece_id: "", quantite: 1, prix_unitaire: 0 })}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter un article
                </button>
              </div>

              {errors.lignes && typeof errors.lignes === "string" && (
                <p className="mb-2 text-[11px] text-red-400">{errors.lignes}</p>
              )}

              <div className="space-y-2">
                {fields.map((field, index) => {
                  const ligne = watchLignes?.[index];
                  const sousTotal = (Number(ligne?.quantite) || 0) * (Number(ligne?.prix_unitaire) || 0);
                  return (
                    <div key={field.id} className="flex items-end gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-white/40 mb-1 block">Pièce *</label>
                        <Controller name={`lignes.${index}.piece_id`} control={control} render={({ field: f }) => (
                          <GlassSelect value={f.value} onChange={f.onChange} options={pieceOptions} />
                        )} />
                        {errors.lignes?.[index]?.piece_id && (
                          <p className="mt-1 text-[10px] text-red-400">{errors.lignes?.[index]?.piece_id?.message}</p>
                        )}
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-white/40 mb-1 block">Qté *</label>
                        <Controller name={`lignes.${index}.quantite`} control={control} render={({ field: f }) => (
                          <GlassNumberInput value={f.value} onChange={f.onChange} min={1} />
                        )} />
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] text-white/40 mb-1 block">P.U. (DA) *</label>
                        <Controller name={`lignes.${index}.prix_unitaire`} control={control} render={({ field: f }) => (
                          <GlassNumberInput value={f.value} onChange={f.onChange} min={0} step="any" />
                        )} />
                      </div>
                      <div className="w-24 text-right">
                        <label className="text-[10px] text-white/40 mb-1 block">Sous-total</label>
                        <p className="text-xs font-mono font-bold text-emerald-400 pt-2">
                          {sousTotal.toLocaleString("fr-FR")} DA
                        </p>
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors mb-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Montant Total */}
            <div className="flex justify-end">
              <div className="px-6 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Montant Total</p>
                <p className="text-lg font-heading font-extrabold text-emerald-400 font-mono">
                  {montantTotal.toLocaleString("fr-FR")} DA
                </p>
              </div>
            </div>

            {serverError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="reception-form"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              "Enregistrement..."
            ) : (
              <>
                Enregistrer la Réception <CheckCircle2 className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
