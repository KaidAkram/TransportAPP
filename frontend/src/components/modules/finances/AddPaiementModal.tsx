"use client";

import { useEffect, useState } from "react";
import { X, CreditCard, Calendar, FileText, Building, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Facture } from "@/types/finance";
import { api } from "@/lib/api";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const paiementSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  montant: z.number().positive("Le montant doit être supérieur à 0"),
  mode: z.enum(["ESPECE", "VIREMENT", "CHEQUE", "CARTE"]),
  reference: z.string().min(1, "La référence est requise"),
  banque: z.string().optional(),
  notes: z.string().optional(),
});

type PaiementFormValues = z.infer<typeof paiementSchema>;

interface AddPaiementModalProps {
  facture: Facture | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPaiementModal({ facture, isOpen, onClose, onSuccess }: AddPaiementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaiementFormValues>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      montant: 0,
      mode: "VIREMENT",
      reference: "",
      banque: "",
      notes: "",
    },
  });

  const selectedMode = watch("mode");

  useEffect(() => {
    if (isOpen && facture) {
      reset({
        date: new Date().toISOString().split("T")[0],
        montant: facture.montant_restant,
        mode: "VIREMENT",
        reference: "",
        banque: "",
        notes: "",
      });
      setError(null);
    }
  }, [isOpen, facture, reset]);

  if (!isOpen || !facture) return null;

  const onSubmit = async (data: PaiementFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/factures/${facture.id}/paiements`, data);

      // Upload pending files to the facture
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("entity_type", "facture");
          uploadData.append("entity_id", facture.id);
          uploadData.append("document_type", "Preuve de Paiement");
          uploadData.append("nom", `Preuve de Paiement - ${data.reference}`);
          try {
            await api.post("/upload", uploadData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (uploadErr) {
            console.error("Failed to upload payment proof:", file.name, uploadErr);
          }
        }
      }

      setPendingFiles([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.detail || err.message || "Erreur lors de l'enregistrement du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isSubmitting ? undefined : onClose}
          className="absolute inset-0 bg-[#0B0514]/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-xl glass-panel p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-white">Encaisser Règlements</h2>
                <p className="text-[10px] font-accent uppercase tracking-widest text-emerald-400 mt-1">Facture {facture.numero}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Total TTC</p>
                  <p className="text-sm font-mono font-bold text-white">{facture.total_ttc.toLocaleString("fr-FR")} DZD</p>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <div>
                  <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Déjà Payé</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">{facture.montant_paye.toLocaleString("fr-FR")} DZD</p>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <div className="text-right">
                  <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mb-1">Reste Dû</p>
                  <p className="text-sm font-mono font-bold text-[var(--color-turbo)]">{facture.montant_restant.toLocaleString("fr-FR")} DZD</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">
                    Date du paiement *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="date"
                      {...register("date")}
                      className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm [color-scheme:dark]"
                    />
                  </div>
                  {errors.date && <p className="text-xs text-red-400 ml-1">{errors.date.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">
                    Montant Encaissé (DZD) *
                  </label>
                  <Controller
                    name="montant"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        {...field}
                        placeholder="0.00"
                        min={0.01}
                        max={facture.montant_restant}
                        step={0.01}
                      />
                    )}
                  />
                  {errors.montant && <p className="text-xs text-red-400 ml-1">{errors.montant.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">
                    Mode de Règlement *
                  </label>
                  <Controller
                    name="mode"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "VIREMENT", label: "Virement Bancaire" },
                          { value: "ESPECE", label: "Espèces" },
                          { value: "CHEQUE", label: "Chèque" },
                          { value: "CARTE", label: "Carte Bancaire" },
                        ]}
                        placeholder="Sélectionnez"
                      />
                    )}
                  />
                  {errors.mode && <p className="text-xs text-red-400 ml-1">{errors.mode.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">
                    N° de Référence / Preuve *
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      {...register("reference")}
                      placeholder="Ex: TR-09384729"
                      className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm"
                    />
                  </div>
                  {errors.reference && <p className="text-xs text-red-400 ml-1">{errors.reference.message}</p>}
                </div>
              </div>

              {(selectedMode === "VIREMENT" || selectedMode === "CHEQUE" || selectedMode === "CARTE") && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">
                    Banque (Optionnel)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      {...register("banque")}
                      placeholder="Nom de la banque"
                      className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">
                  Notes (Optionnel)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                  <textarea
                    {...register("notes")}
                    placeholder="Commentaire additionnel..."
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm resize-none custom-scrollbar"
                  />
                </div>
              </div>

              {/* File Upload Zone */}
              <div className="pt-2 border-t border-white/5 mt-2">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1 mb-2 block">
                  Bordereau / Preuve de paiement (Optionnel)
                </label>
                <CreationFileUploader
                  files={pendingFiles}
                  onFilesChange={setPendingFiles}
                  maxFiles={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Confirmer l'Encaissement
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
