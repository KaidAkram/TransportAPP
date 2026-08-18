"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, X, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Caution } from "@/types/caution";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";
import { Contrat, ContratListResponse } from "@/types/contrat";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";

const cautionSchema = z.object({
  numero: z.string().optional(),
  type: z.enum(["SOUMISSION", "BONNE_EXECUTION"]),
  client_id: z.string().min(1, "Veuillez sélectionner le client bénéficiaire"),
  contrat_id: z.string().optional().nullable(),
  montant: z.coerce.number().min(1, "Le montant cautionné doit être supérieur à zéro"),
  devise: z.string(),
  reference_type: z.string().optional().nullable(),
  reference_numero: z.string().min(1, "La référence de l'AO ou du contrat est requise"),
  objet: z.string().min(5, "L'objet de la garantie financière est requis"),
  date_emission: z.string().min(1, "La date d'émission est requise"),
  date_echeance: z.string().optional().nullable(),
  banque_emetteur: z.string().optional().nullable(),
  statut: z.enum(["CREATION", "CHEZ_CLIENT", "RETOURNEE", "MAIN_LEVEE"]),
});

type CautionFormValues = z.infer<typeof cautionSchema>;

interface AddCautionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCaution: Caution) => void;
  defaultContratId?: string;
  defaultClientId?: string;
}

export function AddCautionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultContratId,
  defaultClientId,
}: AddCautionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [clients, setClients] = useState<Partenaire[]>([]);
  const [contracts, setContracts] = useState<Contrat[]>([]);
  const [generatePdfNow, setGeneratePdfNow] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState<CautionFormValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CautionFormValues>({
    resolver: zodResolver(cautionSchema),
    defaultValues: {
      type: "BONNE_EXECUTION",
      devise: "DZD",
      reference_type: "Contrat",
      banque_emetteur: "Banque Nationale d'Algérie (BNA Agence 612)",
      statut: "CHEZ_CLIENT",
      date_emission: new Date().toISOString().split("T")[0],
      client_id: defaultClientId || "",
      contrat_id: defaultContratId || "",
      montant: 0,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      api
        .get<PartenaireListResponse>("/partenaires", { role_partenaire: "CLIENT", per_page: "100" })
        .then((res) => setClients(res.data.items))
        .catch(console.error);

      api
        .get<ContratListResponse>("/contrats", { per_page: "100" })
        .then((res) => setContracts(res.data.items))
        .catch(console.error);

      if (defaultClientId) setValue("client_id", defaultClientId);
      if (defaultContratId) setValue("contrat_id", defaultContratId);
    } else {
      document.body.style.overflow = "unset";
      setIsConfirming(false);
      setServerError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, defaultClientId, defaultContratId, setValue]);

  if (!mounted || !isOpen) return null;

  const onSubmit = (data: CautionFormValues) => {
    setFormData(data);
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        ...formData,
        montant: Number(formData.montant),
        contrat_id: formData.contrat_id || null,
        date_echeance: formData.date_echeance || null,
      };

      const res = await api.post<Caution>("/cautions", payload);
      let finalCaution = res.data;

      // Automatically generate PDF if checked
      if (generatePdfNow) {
        try {
          const pdfRes = await api.post<Caution>(`/cautions/${finalCaution.id}/generate-pdf`, {});
          finalCaution = pdfRes.data;
        } catch (pdfErr) {
          console.warn("Could not generate PDF immediately:", pdfErr);
        }
      }

      reset();
      setIsConfirming(false);
      onSuccess(finalCaution);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de la caution bancaire.");
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = formData ? clients.find(c => c.id === formData.client_id) : null;
  const selectedContract = formData && formData.contrat_id ? contracts.find(c => c.id === formData.contrat_id) : null;

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass = "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Subtle Background Glow inside Modal */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] pointer-events-none rounded-full transition-colors duration-500 ${isConfirming ? 'bg-[var(--color-turbo)]/15' : 'bg-[#eab308]/10'}`} />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              isConfirming ? 'bg-[var(--color-turbo)]/10 border-[var(--color-turbo)]/20 text-[var(--color-turbo)]' : 'bg-[#eab308]/10 border-[#eab308]/20 text-[#eab308]'
            }`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                {isConfirming ? "Confirmation de la Caution" : "Nouvelle Caution Bancaire"}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {isConfirming 
                  ? "Veuillez vérifier les informations avant validation définitive" 
                  : "Saisie d'un nouvel acte de garantie (Soumission ou Bonne Exécution)"}
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
            <form id="add-caution-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Type et Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type de Caution</label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "BONNE_EXECUTION", label: "Bonne Exécution" },
                          { value: "SOUMISSION", label: "Soumission (Appel d'Offres)" },
                        ]}
                      />
                    )}
                  />
                  {errors.type && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.type.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Client Bénéficiaire</label>
                  <Controller
                    name="client_id"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Sélectionner un client..." },
                          ...clients.map(c => ({ value: c.id, label: c.nom_commercial || c.id }))
                        ]}
                      />
                    )}
                  />
                  {errors.client_id && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.client_id.message}</p>}
                </div>
              </div>

              {/* Réf & Contrat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Référence Contrat / AO</label>
                  <input
                    {...register("reference_numero")}
                    placeholder="Ex: CTR-2026-004 ou AO 05/2026"
                    className={inputClass}
                  />
                  {errors.reference_numero && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.reference_numero.message}</p>}
                </div>
                
                <div>
                  <label className={labelClass}>Contrat Associé (Optionnel)</label>
                  <Controller
                    name="contrat_id"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Aucun contrat lié" },
                          ...contracts.map(c => ({ value: c.id, label: c.reference }))
                        ]}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Montant & Banque */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-4">
                  <label className={labelClass}>Montant Garanti</label>
                  <Controller
                    name="montant"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        step="any"
                        placeholder="Ex: 500000"
                        suffix="DZD"
                      />
                    )}
                  />
                  {errors.montant && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.montant.message}</p>}
                </div>

                <div className="sm:col-span-8">
                  <label className={labelClass}>Banque Émettrice</label>
                  <input
                    {...register("banque_emetteur")}
                    placeholder="Banque..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date d'émission</label>
                  <input
                    type="date"
                    {...register("date_emission")}
                    className={inputClass}
                  />
                  {errors.date_emission && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.date_emission.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Date d'échéance (Optionnel)</label>
                  <input
                    type="date"
                    {...register("date_echeance")}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Objet */}
              <div>
                <label className={labelClass}>Objet de la garantie</label>
                <textarea
                  {...register("objet")}
                  placeholder="Garantie bancaire de soumission pour le projet..."
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
                {errors.objet && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.objet.message}</p>}
              </div>
            </form>
          ) : (
            /* Confirm Screen */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="rounded-xl border border-[var(--color-turbo)]/20 bg-[var(--color-turbo)]/5 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--color-turbo)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">
                    Création de la caution : <span className="font-mono text-[var(--color-turbo)]">{formData?.numero}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Les actes de garantie engagent financièrement l'entreprise. Veuillez revérifier les informations.
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
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Type de Garantie</p>
                  <p className="text-sm font-semibold text-white">
                    {formData?.type === "BONNE_EXECUTION" ? "🛡️ Bonne Exécution" : "📑 Soumission"}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Client Bénéficiaire</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedClient?.nom_commercial || formData?.client_id}
                  </p>
                </div>
                <div className="bg-[var(--color-electric-violet)]/10 rounded-xl p-4 border border-[var(--color-electric-violet)]/20">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-electric-violet)]/70 mb-1">Montant Cautionné</p>
                  <p className="text-lg font-bold font-mono text-[var(--color-electric-violet)]">
                    {Number(formData?.montant).toLocaleString("fr-DZ")} {formData?.devise}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Contrat / Référence</p>
                  <p className="text-sm font-semibold text-white font-mono">
                    {selectedContract ? selectedContract.reference : formData?.reference_numero}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Banque & Dates</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-white/80">{formData?.banque_emetteur}</p>
                  <p className="text-xs font-mono text-white/60">
                    Du {new Date(formData?.date_emission || "").toLocaleDateString("fr-FR")}
                    {formData?.date_echeance && ` au ${new Date(formData.date_echeance).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
              </div>

              {/* Generate PDF Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-turbo)]/20 bg-[var(--color-turbo)]/5 cursor-pointer hover:bg-[var(--color-turbo)]/10 transition-colors">
                <input
                  type="checkbox"
                  checked={generatePdfNow}
                  onChange={(e) => setGeneratePdfNow(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-[var(--color-turbo)] focus:ring-[var(--color-turbo)]/50 focus:ring-offset-0"
                />
                <div>
                  <p className="text-xs font-bold text-[var(--color-turbo)] flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Générer l'attestation PDF immédiatement
                  </p>
                  <p className="text-[10px] text-[var(--color-turbo)]/70">Un document officiel sera créé et rattaché à la caution.</p>
                </div>
              </label>
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
              className="px-6 py-2 rounded-xl text-xs font-bold bg-[#eab308] text-[var(--color-haiti)] hover:bg-[#ca9a04] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center gap-2"
            >
              Continuer <ShieldCheck className="h-3.5 w-3.5" />
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
                <>Confirmer la création <CheckCircle2 className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
