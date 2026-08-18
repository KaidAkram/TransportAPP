"use client";

import { useEffect, useState } from "react";
import { X, Receipt, Calendar, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api } from "@/lib/api";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";
import { GlassSelect } from "@/components/ui/GlassSelect";

const factureLigneSchema = z.object({
  service: z.string().min(1, "Le service est requis"),
  description: z.string().min(1, "La description est requise"),
  quantite: z.number().positive("Quantité invalide"),
  prix_unitaire: z.number().min(0, "Prix invalide"),
});

const factureSchema = z.object({
  numero: z.string().optional(),
  client_id: z.string().min(1, "Le client est requis"),
  devis_id: z.string().optional(),
  contrat_id: z.string().optional(),
  date_emission: z.string().min(1, "Date requise"),
  date_echeance: z.string().min(1, "Date requise"),
  mode_reglement: z.enum(["ESPECE", "VIREMENT", "CHEQUE", "CARTE"]),
  notes: z.string().optional(),
  taux_tva: z.number().min(0).max(100),
  lignes: z.array(factureLigneSchema).min(1, "Ajoutez au moins une ligne"),
});

type FactureFormValues = z.infer<typeof factureSchema>;

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<FactureFormValues>({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      client_id: "",
      date_emission: new Date().toISOString().split("T")[0],
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      mode_reglement: "VIREMENT",
      taux_tva: 19,
      notes: "",
      lignes: [{ service: "", description: "", quantite: 1, prix_unitaire: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lignes",
  });

  const watchLignes = watch("lignes");
  const watchTva = watch("taux_tva");

  // Calculate totals
  const totalHT = watchLignes.reduce((sum, ligne) => sum + (ligne.quantite || 0) * (ligne.prix_unitaire || 0), 0);
  const montantTVA = totalHT * ((watchTva || 0) / 100);
  const totalTTC = totalHT + montantTVA;

  useEffect(() => {
    if (isOpen) {
      // Fetch clients and devis
      api.get("/partenaires").then(res => {
        const data = res.data as any;
        const clientList = data.items?.filter((p: any) => p.type === "CLIENT") || data || [];
        setClients(clientList);
      }).catch(err => console.error("Error fetching clients", err));



      reset({
        numero: "FAC-" + new Date().getFullYear() + "-" + Math.floor(100 + Math.random() * 900).toString(),
        client_id: "",
        date_emission: new Date().toISOString().split("T")[0],
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        mode_reglement: "VIREMENT",
        taux_tva: 19,
        notes: "",
        lignes: [{ service: "", description: "", quantite: 1, prix_unitaire: 0 }],
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
      setError(err.detail || err.message || "Erreur lors de l'émission de la facture");
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
          className="relative w-full max-w-4xl glass-panel p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-electric-violet)] to-transparent opacity-50" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--color-electric-violet)]/10 border border-[var(--color-electric-violet)]/20">
                <Receipt className="w-5 h-5 text-[var(--color-electric-violet)]" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-white">Nouvelle Facture</h2>
                <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] mt-1">Émission de Facture Client</p>
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
            <div className="p-6 space-y-8">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Section 1: Informations Générales */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white/80 border-b border-white/5 pb-2">Informations Générales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">Client Facturé *</label>
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
                    {errors.client_id && <p className="text-xs text-red-400 ml-1">{errors.client_id.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">Date d'émission *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="date"
                        {...register("date_emission")}
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm [color-scheme:dark]"
                      />
                    </div>
                    {errors.date_emission && <p className="text-xs text-red-400 ml-1">{errors.date_emission.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">Date d'échéance *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="date"
                        {...register("date_echeance")}
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm [color-scheme:dark]"
                      />
                    </div>
                    {errors.date_echeance && <p className="text-xs text-red-400 ml-1">{errors.date_echeance.message}</p>}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">Mode de Règlement Prévu *</label>
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
                    {errors.mode_reglement && <p className="text-xs text-red-400 ml-1">{errors.mode_reglement.message}</p>}
                  </div>
                </div>
              </div>

              {/* Section 2: Lignes de Facturation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-white/80">Lignes de Facturation</h3>
                  <button
                    type="button"
                    onClick={() => append({ service: "", description: "", quantite: 1, prix_unitaire: 0 })}
                    className="inline-flex items-center gap-1 text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Ajouter Ligne
                  </button>
                </div>
                
                {errors.lignes?.root && <p className="text-xs text-red-400">{errors.lignes.root.message}</p>}

                <div className="space-y-3">
                  {fields.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/10 relative group">
                      <div className="col-span-12 md:col-span-3 space-y-1">
                        <label className="text-[9px] font-accent uppercase tracking-widest text-white/40 ml-1">Service *</label>
                        <input
                          {...register(`lignes.${index}.service`)}
                          placeholder="Ex: Transport"
                          className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm"
                        />
                        {errors.lignes?.[index]?.service && <p className="text-[10px] text-red-400">{errors.lignes[index]?.service?.message}</p>}
                      </div>
                      <div className="col-span-12 md:col-span-4 space-y-1">
                        <label className="text-[9px] font-accent uppercase tracking-widest text-white/40 ml-1">Description *</label>
                        <input
                          {...register(`lignes.${index}.description`)}
                          placeholder="Détails de la prestation"
                          className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm"
                        />
                        {errors.lignes?.[index]?.description && <p className="text-[10px] text-red-400">{errors.lignes[index]?.description?.message}</p>}
                      </div>
                      <div className="col-span-6 md:col-span-2 space-y-1">
                        <label className="text-[9px] font-accent uppercase tracking-widest text-white/40 ml-1">Qté *</label>
                        <Controller
                          name={`lignes.${index}.quantite`}
                          control={control}
                          render={({ field }) => (
                            <GlassNumberInput {...field} min={1} />
                          )}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2 space-y-1">
                        <label className="text-[9px] font-accent uppercase tracking-widest text-white/40 ml-1">Prix U. (DZD) *</label>
                        <Controller
                          name={`lignes.${index}.prix_unitaire`}
                          control={control}
                          render={({ field }) => (
                            <GlassNumberInput {...field} min={0} step={100} />
                          )}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-1 flex items-center justify-end md:justify-center md:pt-6">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Totaux & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">Taux TVA (%)</label>
                    <Controller
                      name="taux_tva"
                      control={control}
                      render={({ field }) => (
                        <GlassNumberInput {...field} min={0} max={100} />
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-accent uppercase tracking-widest text-white/40 ml-1">Notes sur la facture</label>
                    <textarea
                      {...register("notes")}
                      placeholder="Commentaires ou instructions..."
                      rows={3}
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] transition-colors text-sm resize-none custom-scrollbar"
                    />
                  </div>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-xl p-6 flex flex-col justify-center space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Total HT</span>
                    <span className="font-mono text-white/80">{totalHT.toLocaleString("fr-FR")} DZD</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">TVA ({watchTva}%)</span>
                    <span className="font-mono text-white/80">{montantTVA.toLocaleString("fr-FR")} DZD</span>
                  </div>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-accent uppercase tracking-widest text-[var(--color-electric-violet)]">Total TTC</span>
                    <span className="text-xl font-heading font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                      {totalTTC.toLocaleString("fr-FR")} <span className="text-xs font-sans text-white/40 font-normal">DZD</span>
                    </span>
                  </div>
                </div>
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
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-[var(--color-electric-violet)]/80 border border-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)] shadow-[0_0_15px_rgba(131,77,251,0.3)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <Receipt className="w-4 h-4" />
                )}
                Émettre Facture
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
