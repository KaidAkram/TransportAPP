import sys

file_path = "c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/components/modules/contrats/AddContractModal.tsx"

content = """"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Contrat } from "@/types/contrat";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";
import { GlassSelect } from "@/components/ui/GlassSelect";

const contractSchema = z.object({
  reference: z.string().min(2, "La référence contractuelle est requise (ex: CTR-2026-001)"),
  partenaire_id: z.string().min(1, "Veuillez sélectionner un partenaire contractant"),
  objet: z.string().min(5, "L'objet du contrat est requis"),
  type_contrat: z.string().min(1, "Le type de contrat est requis"),
  date_debut: z.string().min(1, "La date de début est requise"),
  date_fin: z.string().min(1, "La date de fin est requise"),
  montant: z.number().min(0, "Le montant doit être positif"),
  devise: z.string(),
  mode_facturation: z.string().optional().nullable(),
  conditions_paiement: z.string().optional().nullable(),
  statut: z.enum(["ACTIF", "EXPIRE"]),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContract: Contrat) => void;
}

const glassInput = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all shadow-inner font-medium";
const glassInputMono = `${glassInput} font-mono text-[#0ea5e9]`;
const glassLabel = "block text-[11px] font-accent uppercase tracking-widest text-white/50 mb-2 font-bold";

export function AddContractModal({ isOpen, onClose, onSuccess }: AddContractModalProps) {
  const [partners, setPartners] = useState<Partenaire[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      type_contrat: "Transport",
      devise: "DZD",
      mode_facturation: "Mensuel",
      conditions_paiement: "Virement bancaire 30 jours",
      statut: "ACTIF",
      montant: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      api
        .get<PartenaireListResponse>("/partenaires", { per_page: "100" })
        .then((res) => setPartners(res.data.items))
        .catch(console.error);
    }
  }, [isOpen]);

  const onSubmit = async (data: ContractFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<Contrat>("/contrats", {
        ...data,
        montant: Number(data.montant),
      });

      // Upload pending files if any
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("entity_type", "contrat");
          uploadData.append("entity_id", res.data.id);
          uploadData.append("document_type", "Autre");
          try {
            await api.post("/upload", uploadData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (uploadErr) {
            console.error("Failed to upload file:", file.name, uploadErr);
          }
        }
      }

      reset();
      setPendingFiles([]);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création du contrat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(14,165,233,0.08), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0ea5e9]/20 text-[#0ea5e9] border border-[#0ea5e9]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">
                Nouveau Contrat Commercial
              </h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[#0ea5e9] mt-0.5">
                Convention de transport, location ou prestation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={glassLabel}>
                Référence Contrat *
              </label>
              <input
                {...register("reference")}
                placeholder="ex: CTR-2026-001"
                className={glassInputMono}
              />
              {errors.reference && (
                <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.reference.message}</p>
              )}
            </div>

            <div>
              <label className={glassLabel}>
                Partenaire Contractant *
              </label>
              <Controller
                name="partenaire_id"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    options={partners.map(p => ({
                      value: p.id,
                      label: `${p.nom_commercial} (${p.role_partenaire === "CLIENT" ? "Client" : "Fournisseur"})`
                    }))}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Sélectionner une entreprise..."
                  />
                )}
              />
              {errors.partenaire_id && (
                <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.partenaire_id.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={glassLabel}>
                Objet de la Convention *
              </label>
              <input
                {...register("objet")}
                placeholder="ex: Convention de transport de personnel"
                className={glassInput}
              />
              {errors.objet && <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.objet.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>
                Type de Contrat
              </label>
              <Controller
                name="type_contrat"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    options={[
                      { value: "Transport", label: "Transport Régulier / Navettes" },
                      { value: "Tourisme", label: "Circuits Touristiques & Voyages" },
                      { value: "Location", label: "Location d'Autocars" },
                      { value: "Fourniture", label: "Fourniture de Pièces" },
                      { value: "Maintenance", label: "Maintenance Spécialisée" },
                    ]}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Sélectionner..."
                  />
                )}
              />
            </div>

            <div>
              <label className={glassLabel}>
                Statut Contractuel
              </label>
              <Controller
                name="statut"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    options={[
                      { value: "ACTIF", label: "Contrat Actif" },
                      { value: "EXPIRE", label: "Expiré / Clôturé" },
                    ]}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Sélectionner..."
                  />
                )}
              />
            </div>

            <div>
              <label className={glassLabel}>
                Date d'Effet (Début) *
              </label>
              <input
                type="date"
                {...register("date_debut")}
                className={glassInput}
              />
              {errors.date_debut && (
                <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.date_debut.message}</p>
              )}
            </div>

            <div>
              <label className={glassLabel}>
                Date d'Échéance (Fin) *
              </label>
              <input
                type="date"
                {...register("date_fin")}
                className={glassInput}
              />
              {errors.date_fin && (
                <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.date_fin.message}</p>
              )}
            </div>

            <div>
              <label className={glassLabel}>
                Montant Global HT (DZD) *
              </label>
              <input
                type="number"
                step="1000"
                {...register("montant", { valueAsNumber: true })}
                placeholder="15000000"
                className={glassInputMono}
              />
              {errors.montant && (
                <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.montant.message}</p>
              )}
            </div>

            <div>
              <label className={glassLabel}>
                Mode de Facturation
              </label>
              <Controller
                name="mode_facturation"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    options={[
                      { value: "Mensuel", label: "Facturation Mensuelle" },
                      { value: "Au voyage", label: "Au Voyage / Rotation" },
                      { value: "Forfait", label: "Forfaitaire Global" },
                      { value: "Par kilomètre", label: "Au Kilomètre Parcouru" },
                    ]}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Sélectionner..."
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label className={glassLabel}>
                Conditions de Paiement & Modalités
              </label>
              <input
                {...register("conditions_paiement")}
                placeholder="ex: Virement bancaire BNA à 30 jours fin de mois après service fait"
                className={glassInput}
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div className="pt-2 border-t border-white/10 mt-4">
            <label className={glassLabel}>
              Pièces Jointes (Optionnel)
            </label>
            <CreationFileUploader
              files={pendingFiles}
              onFilesChange={setPendingFiles}
              maxFiles={5}
            />
          </div>

          {/* Footer Actions */}
          <div className="relative flex items-center justify-end gap-4 px-6 py-5 border-t border-white/10 bg-black/20 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/70 hover:text-white hover:bg-white/10 font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transition-all font-bold px-6"
            >
              {isSubmitting ? "Enregistrement..." : "Ajouter le contrat"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("AddContractModal rewritten successfully.")
