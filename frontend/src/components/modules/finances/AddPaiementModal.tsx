"use client";

import { useEffect, useState } from "react";
import { X, CreditCard, Calendar, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Facture } from "@/types/finance";
import { api } from "@/lib/api";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const encaissementSchema = z.object({
  mode_reglement: z.enum(["ESPECE", "VIREMENT", "CHEQUE", "CARTE"]),
  date_reglement: z.string().min(1, "La date est requise"),
});

type EncaissementFormValues = z.infer<typeof encaissementSchema>;

interface EncaisserModalProps {
  facture: Facture | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EncaisserModal({ facture, isOpen, onClose, onSuccess }: EncaisserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EncaissementFormValues>({
    resolver: zodResolver(encaissementSchema),
    defaultValues: {
      mode_reglement: "VIREMENT",
      date_reglement: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (isOpen && facture) {
      reset({
        mode_reglement: "VIREMENT",
        date_reglement: new Date().toISOString().split("T")[0],
      });
      setError(null);
      setPendingFiles([]);
    }
  }, [isOpen, facture, reset]);

  if (!isOpen || !facture) return null;

  const onSubmit = async (data: EncaissementFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("mode_reglement", data.mode_reglement);
      formData.append("date_reglement", data.date_reglement);

      if (pendingFiles.length > 0) {
        formData.append("document", pendingFiles[0]);
      }

      await api.post(`/factures/${facture.id}/encaisser`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPendingFiles([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.detail || err.message || "Erreur lors de l'encaissement");
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
          <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />

          <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-white">Encaisser la Facture</h2>
                <p className="text-[10px] font-accent uppercase tracking-widest text-emerald-400 mt-1">
                  {facture.numero} — {facture.montant_facture.toLocaleString("fr-FR")} DZD
                </p>
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
            <div className="p-6 space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Client</p>
                  <p className="text-sm font-medium text-white">{facture.client_nom || "Client"}</p>
                </div>
                <div className="h-8 w-px bg-white/10 mx-4" />
                <div className="text-end">
                  <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Montant à Encaisser</p>
                  <p className="text-lg font-heading font-bold text-emerald-400">{facture.montant_facture.toLocaleString("fr-FR")} DZD</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">
                    Mode de Règlement *
                  </label>
                  <Controller
                    name="mode_reglement"
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
                  {errors.mode_reglement && <p className="text-xs text-red-400 ms-1">{errors.mode_reglement.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">
                    Date de Règlement *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="date"
                      {...register("date_reglement")}
                      className="w-full ps-10 pe-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors text-sm [color-scheme:dark]"
                    />
                  </div>
                  {errors.date_reglement && <p className="text-xs text-red-400 ms-1">{errors.date_reglement.message}</p>}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1 mb-2 block">
                  Document justificatif (Optionnel)
                </label>
                <CreationFileUploader
                  files={pendingFiles}
                  onFilesChange={setPendingFiles}
                  maxFiles={1}
                />
              </div>
            </div>

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
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500/80 border border-emerald-500 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
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
