"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Caution } from "@/types/caution";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const demandeSchema = z.object({
  client_id: z.string().min(1, "Veuillez sélectionner le bénéficiaire"),
  montant: z.coerce.number().min(1, "Le montant doit être supérieur à zéro"),
  banque_emetteur: z.string().min(1, "La banque émettrice est requise"),
  date_emission: z.string().min(1, "La date d'émission est requise"),
  reference_numero: z.string().min(1, "La référence est requise"),
  objet: z.string().min(5, "L'objet est requis"),
  lieu_demande: z.string().optional(),
  numero_compte_bancaire: z.string().optional(),
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
      client_id: "",
      montant: 0,
      banque_emetteur: "Banque Nationale d'Algérie (BNA)",
      date_emission: new Date().toISOString().split("T")[0],
      reference_numero: "",
      objet: "",
      lieu_demande: "",
      numero_compte_bancaire: "",
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
        type: "DEMANDE" as const,
        client_id: data.client_id,
        montant: Number(data.montant),
        statut: "CREATION" as const,
        devise: "DZD",
        banque_emetteur: data.banque_emetteur,
        date_emission: data.date_emission,
        reference_numero: data.reference_numero,
        objet: data.objet,
        lieu_demande: data.lieu_demande || null,
        numero_compte_bancaire: data.numero_compte_bancaire || null,
      };

      const res = await api.post<Caution>("/cautions", payload);
      const newCaution = res.data;

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
        <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] pointer-events-none rounded-full bg-[var(--color-electric-violet)]/10" />

        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-electric-violet)]/20 bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                Nouvelle Demande de Caution
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Génération de la demande de caution bancaire (PDF)
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

        <div className="p-6 overflow-y-auto relative z-10 flex-1 custom-scrollbar">
          <form id="demande-caution-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Bénéficiaire */}
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

            {/* Référence de l'appel d'offres */}
            <div>
              <label className={labelClass}>Référence de l'appel d'offres</label>
              <input
                {...register("reference_numero")}
                placeholder="Ex: AO 05/2026"
                className={inputClass}
              />
              {errors.reference_numero && (
                <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.reference_numero.message}</p>
              )}
            </div>

            {/* Objet de l'appel d'offres */}
            <div>
              <label className={labelClass}>Objet de l'appel d'offres</label>
              <textarea
                {...register("objet")}
                placeholder="Objet de l'appel d'offres..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
              {errors.objet && (
                <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.objet.message}</p>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className={labelClass}>Montant de la caution</label>
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

            {/* Banque + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
              <div>
                <label className={labelClass}>Date d'Émission</label>
                <input type="date" {...register("date_emission")} className={inputClass} />
                {errors.date_emission && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.date_emission.message}</p>
                )}
              </div>
            </div>

            {/* Notre compte bancaire */}
            <div>
              <label className={labelClass}>Notre compte bancaire</label>
              <input
                {...register("numero_compte_bancaire")}
                placeholder="Ex: 001 00954 0300 101763 41"
                className={inputClass}
              />
            </div>

            {/* Lieu */}
            <div>
              <label className={labelClass}>Lieu</label>
              <input
                {...register("lieu_demande")}
                placeholder="Ex: Alger"
                className={inputClass}
              />
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
