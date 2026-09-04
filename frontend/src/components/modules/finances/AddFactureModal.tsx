"use client";

import { useEffect, useState } from "react";
import { X, Receipt, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api } from "@/lib/api";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassMultiSelect } from "@/components/ui/GlassMultiSelect";

const factureSchema = z.object({
  numero: z.string().min(1, "Le numéro est requis"),
  client_id: z.string().min(1, "Le client est requis"),
  date_facture: z.string().min(1, "La date est requise"),
  mois_realisation: z.string().min(1, "Le mois de réalisation est requis"),
  annee_realisation: z.coerce.number().int().min(2000, "L'année est requise"),
  montant_facture: z.coerce.number().positive("Le montant doit être supérieur à 0"),
  remarques: z.string().optional(),
});

type FactureFormValues = z.infer<typeof factureSchema>;

const MOIS_OPTIONS = [
  { value: "Janvier", label: "Janvier" },
  { value: "Février", label: "Février" },
  { value: "Mars", label: "Mars" },
  { value: "Avril", label: "Avril" },
  { value: "Mai", label: "Mai" },
  { value: "Juin", label: "Juin" },
  { value: "Juillet", label: "Juillet" },
  { value: "Août", label: "Août" },
  { value: "Septembre", label: "Septembre" },
  { value: "Octobre", label: "Octobre" },
  { value: "Novembre", label: "Novembre" },
  { value: "Décembre", label: "Décembre" },
];

interface AddFactureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFactureModal({ isOpen, onClose, onSuccess }: AddFactureModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: string; nom_commercial: string }[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FactureFormValues>({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      numero: "",
      client_id: "",
      date_facture: new Date().toISOString().split("T")[0],
      mois_realisation: "",
      annee_realisation: new Date().getFullYear(),
      montant_facture: 0,
      remarques: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      api.get("/partenaires", { role_partenaire: "CLIENT", per_page: "100" }).then(res => {
        const data = res.data as any;
        const clientList = data.items || data || [];
        setClients(clientList);
      }).catch(err => console.error("Error fetching clients", err));

      const currentMonth = MOIS_OPTIONS[new Date().getMonth()]?.label || "";
      reset({
        numero: "",
        client_id: "",
        date_facture: new Date().toISOString().split("T")[0],
        mois_realisation: currentMonth,
        annee_realisation: new Date().getFullYear(),
        montant_facture: 0,
        remarques: "",
      });
      setError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FactureFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post("/factures", data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.detail || err.message || "Erreur lors de la création de la facture");
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
          className="relative w-full max-w-lg glass-panel p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />

          <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-white">Nouvelle Facture</h2>
                <p className="text-[10px] font-accent uppercase tracking-widest text-emerald-400 mt-1">Ajouter une facture</p>
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

          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto custom-scrollbar flex-1">
            <div className="p-6 space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">Numéro de Facture *</label>
                <div className="relative">
                  <Receipt className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    {...register("numero")}
                    placeholder="ex: INV-2026-001"
                    className="w-full ps-10 pe-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors text-sm"
                  />
                </div>
                {errors.numero && <p className="text-xs text-red-400 ms-1">{errors.numero.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">Client *</label>
                <Controller
                  name="client_id"
                  control={control}
                  render={({ field }) => (
                    <GlassSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={clients.map(c => ({ value: c.id, label: c.nom_commercial }))}
                      placeholder="Sélectionnez un client"
                    />
                  )}
                />
                {errors.client_id && <p className="text-xs text-red-400 ms-1">{errors.client_id.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">Date Facture *</label>
                  <div className="relative">
                    <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="date"
                      {...register("date_facture")}
                      className="w-full ps-10 pe-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors text-sm [color-scheme:dark]"
                    />
                  </div>
                  {errors.date_facture && <p className="text-xs text-red-400 ms-1">{errors.date_facture.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">Mois de Réalisation *</label>
                  <Controller
                    name="mois_realisation"
                    control={control}
                    render={({ field }) => (
                      <GlassMultiSelect
                        value={field.value ? field.value.split(", ") : []}
                        onChange={(vals) => field.onChange(vals.join(", "))}
                        options={MOIS_OPTIONS}
                        placeholder="Mois (Ex: Janvier, Février)"
                      />
                    )}
                  />
                  {errors.mois_realisation && <p className="text-xs text-red-400 ms-1">{errors.mois_realisation.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">Année de Réalisation *</label>
                  <Controller
                    name="annee_realisation"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput {...field} min={2000} max={2100} step={1} placeholder={new Date().getFullYear().toString()} />
                    )}
                  />
                  {errors.annee_realisation && <p className="text-xs text-red-400 ms-1">{errors.annee_realisation.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">Montant Facture (DZD) *</label>
                <Controller
                  name="montant_facture"
                  control={control}
                  render={({ field }) => (
                    <GlassNumberInput {...field} min={0} step="any" customStep={1000} placeholder="0" />
                  )}
                />
                {errors.montant_facture && <p className="text-xs text-red-400 ms-1">{errors.montant_facture.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ms-1">Remarques</label>
                <textarea
                  {...register("remarques")}
                  placeholder="Notes ou remarques optionnelles..."
                  rows={3}
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors text-sm resize-none custom-scrollbar"
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
                  <Receipt className="w-4 h-4" />
                )}
                Ajouter Facture
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
