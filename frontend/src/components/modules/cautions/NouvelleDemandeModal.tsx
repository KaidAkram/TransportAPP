"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import { Caution } from "@/types/caution";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const demandeSchema = z.object({
  type: z.enum(["SOUMISSION", "BONNE_EXECUTION"]),
  client_id: z.string().min(1, "Veuillez sélectionner le bénéficiaire"),
  montant: z.coerce.number().min(1, "Le montant doit être supérieur à zéro"),
  banque_emetteur: z.string().min(1, "La banque émettrice est requise"),
  date_emission: z.string().min(1, "La date d'émission est requise"),
  reference_numero: z.string().min(1, "La référence AO / contrat est requise"),
  objet: z.string().min(5, "L'objet de la garantie est requis"),
  lieu_demande: z.string().optional(),
  lieu_soumission: z.string().optional(),
  numero_compte_bancaire: z.string().optional(),
  societe_nom: z.string().optional(),
  client_societe_nom: z.string().optional(),
});

type DemandeFormValues = z.infer<typeof demandeSchema>;

interface NouvelleDemandeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCaution: Caution) => void;
}

export function NouvelleDemandeModal({
  isOpen,
  onClose,
  onSuccess,
}: NouvelleDemandeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [clients, setClients] = useState<Partenaire[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DemandeFormValues>({
    resolver: zodResolver(demandeSchema),
    defaultValues: {
      type: "SOUMISSION",
      client_id: "",
      montant: 0,
      banque_emetteur: "Banque Nationale d'Algérie (BNA)",
      date_emission: new Date().toISOString().split("T")[0],
      reference_numero: "",
      objet: "",
      lieu_demande: "",
      lieu_soumission: "",
      numero_compte_bancaire: "",
      societe_nom: "",
      client_societe_nom: "",
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
    } else {
      document.body.style.overflow = "unset";
      setServerError(null);
      setFiles([]);
      reset();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, reset]);

  if (!mounted || !isOpen) return null;

  const onSubmit = async (data: DemandeFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        ...data,
        montant: Number(data.montant),
        type: data.type,
        statut: "CREATION" as const,
        devise: "DZD",
        lieu_demande: data.lieu_demande || null,
        lieu_soumission: data.lieu_soumission || null,
        numero_compte_bancaire: data.numero_compte_bancaire || null,
        societe_nom: data.societe_nom || null,
        client_societe_nom: data.client_societe_nom || null,
      };

      const res = await api.post<Caution>("/cautions", payload);
      const newCaution = res.data;

      // Upload attached files
      if (files.length > 0) {
        for (const file of files) {
          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("entity_type", "caution");
            formData.append("entity_id", newCaution.id);
            formData.append("document_type", "Demande de caution");
            await api.post("/upload", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (fileErr) {
            console.warn("File upload failed:", fileErr);
          }
        }
      }

      // Auto-generate PDF
      let finalCaution = newCaution;
      try {
        const pdfRes = await api.post<Caution>(`/cautions/${newCaution.id}/generate-pdf`, {});
        finalCaution = pdfRes.data;
      } catch (pdfErr) {
        console.warn("PDF generation failed:", pdfErr);
      }

      reset();
      setFiles([]);
      onSuccess(finalCaution);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass =
    "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] pointer-events-none rounded-full bg-[var(--color-electric-violet)]/10" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-electric-violet)]/20 bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                Nouvelle Demande
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Génération rapide d'une demande de caution bancaire
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

        {/* Form */}
        <div className="p-6 overflow-y-auto relative z-10 flex-1 custom-scrollbar">
          <form id="demande-caution-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Type + Client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type de Garantie</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <GlassSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "SOUMISSION", label: "Soumission" },
                        { value: "BONNE_EXECUTION", label: "Bonne Exécution" },
                      ]}
                    />
                  )}
                />
                {errors.type && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Bénéficiaire</label>
                <Controller
                  name="client_id"
                  control={control}
                  render={({ field }) => (
                    <GlassSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "", label: "Sélectionner..." },
                        ...clients.map((c) => ({
                          value: c.id,
                          label: c.nom_commercial || c.id,
                        })),
                      ]}
                    />
                  )}
                />
                {errors.client_id && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.client_id.message}</p>
                )}
              </div>
            </div>

            {/* Montant + Banque */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-5">
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
                {errors.montant && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.montant.message}</p>
                )}
              </div>

              <div className="sm:col-span-7">
                <label className={labelClass}>Banque Émettrice</label>
                <input
                  {...register("banque_emetteur")}
                  placeholder="Banque..."
                  className={inputClass}
                />
                {errors.banque_emetteur && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.banque_emetteur.message}</p>
                )}
              </div>
            </div>

            {/* Date + Référence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date d'Émission</label>
                <input type="date" {...register("date_emission")} className={inputClass} />
                {errors.date_emission && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.date_emission.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Référence AO / Contrat</label>
                <input
                  {...register("reference_numero")}
                  placeholder="Ex: AO 05/2026"
                  className={inputClass}
                />
                {errors.reference_numero && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.reference_numero.message}</p>
                )}
              </div>
            </div>

            {/* Objet */}
            <div>
              <label className={labelClass}>Objet de la Garantie</label>
              <textarea
                {...register("objet")}
                placeholder="Garantie bancaire de soumission pour le projet..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
              {errors.objet && (
                <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.objet.message}</p>
              )}
            </div>

            {/* Société + Compte bancaire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nom de la Société</label>
                <input
                  {...register("societe_nom")}
                  placeholder="Ex: ENGTP DIRECTION REGIONALE ARZEW"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nom de la Société du Client</label>
                <input
                  {...register("client_societe_nom")}
                  placeholder="Ex: SONATRACH"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Compte bancaire */}
            <div>
              <label className={labelClass}>N° Compte Bancaire</label>
              <input
                {...register("numero_compte_bancaire")}
                placeholder="Ex: 001 00954 0300 101763 41"
                className={inputClass}
              />
            </div>

            {/* Lieu de demande / Lieu de soumission */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Lieu de la Demande</label>
                <input
                  {...register("lieu_demande")}
                  placeholder="Ex: Arzew"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Lieu de Soumission</label>
                <input
                  {...register("lieu_soumission")}
                  placeholder="Ex: Alger"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Documents */}
            <div>
              <label className={labelClass}>Documents joints</label>
              <CreationFileUploader
                files={files}
                onFilesChange={setFiles}
                maxFiles={5}
              />
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
            form="demande-caution-form"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#6c3ce0] hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] transition-all flex items-center gap-2 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              "Création..."
            ) : (
              <>
                Générer la Demande <CheckCircle2 className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
