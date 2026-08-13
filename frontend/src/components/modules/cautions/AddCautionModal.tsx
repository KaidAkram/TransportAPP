"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, X, AlertCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Caution } from "@/types/caution";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";
import { Contrat, ContratListResponse } from "@/types/contrat";

const cautionSchema = z.object({
  numero: z.string().min(2, "Le numéro de caution est requis (ex: CAU-2026-002)"),
  type: z.enum(["SOUMISSION", "BONNE_EXECUTION"]),
  client_id: z.string().min(1, "Veuillez sélectionner le client bénéficiaire"),
  contrat_id: z.string().optional().nullable(),
  montant: z.number().min(1, "Le montant cautionné doit être supérieur à zéro"),
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
  const [clients, setClients] = useState<Partenaire[]>([]);
  const [contracts, setContracts] = useState<Contrat[]>([]);
  const [generatePdfNow, setGeneratePdfNow] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
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
    if (isOpen) {
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
    }
  }, [isOpen, defaultClientId, defaultContratId, setValue]);

  if (!isOpen) return null;

  const onSubmit = async (data: CautionFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        ...data,
        montant: Number(data.montant),
        contrat_id: data.contrat_id || null,
        date_echeance: data.date_echeance || null,
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
      onSuccess(finalCaution);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de la caution bancaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-table-header">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-bg text-warning">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nouvelle Caution Bancaire</h2>
              <p className="text-xs text-text-secondary">Garantie de Soumission ou de Bonne Exécution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-bg p-3 text-xs text-danger-text border border-danger/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Numéro de Caution *
              </label>
              <input
                {...register("numero")}
                placeholder="ex: CAU-2026-001"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.numero && <p className="text-[11px] text-danger mt-1">{errors.numero.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Type de Caution *
              </label>
              <select
                {...register("type")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="BONNE_EXECUTION">🛡️ Caution de Bonne Exécution (Marché)</option>
                <option value="SOUMISSION">📑 Caution de Soumission (Appel d&apos;Offres)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Client Bénéficiaire *
              </label>
              <select
                {...register("client_id")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Sélectionner le client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom_commercial}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-[11px] text-danger mt-1">{errors.client_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Contrat Rattaché (Optionnel)
              </label>
              <select
                {...register("contrat_id")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Aucun contrat rattaché</option>
                {contracts.map((ctr) => (
                  <option key={ctr.id} value={ctr.id}>
                    {ctr.reference} — {ctr.objet.slice(0, 35)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Réf. Marché / Appel d&apos;Offres *
              </label>
              <input
                {...register("reference_numero")}
                placeholder="ex: AO N°12/2026 ou CTR-2026-001"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.reference_numero && (
                <p className="text-[11px] text-danger mt-1">{errors.reference_numero.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Montant Cautionné (DZD) *
              </label>
              <input
                type="number"
                step="1000"
                {...register("montant", { valueAsNumber: true })}
                placeholder="750000"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.montant && (
                <p className="text-[11px] text-danger mt-1">{errors.montant.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Objet & Motif de l&apos;Engagement *
              </label>
              <input
                {...register("objet")}
                placeholder="ex: Garantie de bonne exécution du marché de transport régulier de passagers"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.objet && <p className="text-[11px] text-danger mt-1">{errors.objet.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date d&apos;Émission *
              </label>
              <input
                type="date"
                {...register("date_emission")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.date_emission && (
                <p className="text-[11px] text-danger mt-1">{errors.date_emission.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date d&apos;Échéance / Validité
              </label>
              <input
                type="date"
                {...register("date_echeance")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Banque Garante Émettrice
              </label>
              <input
                {...register("banque_emetteur")}
                placeholder="ex: Banque Nationale d'Algérie (BNA)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Statut de la Caution
              </label>
              <select
                {...register("statut")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="CHEZ_CLIENT">🟠 Chez le Client (En cours)</option>
                <option value="CREATION">🟡 En Création / Signature</option>
                <option value="RETOURNEE">🟢 Retournée par le client</option>
                <option value="MAIN_LEVEE">⚪ Mainlevée Définitive Accordée</option>
              </select>
            </div>
          </div>

          {/* Direct PDF Generation Checkbox */}
          <div className="rounded-lg border border-primary-base/20 bg-primary-light/10 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generatePdfNow}
                onChange={(e) => setGeneratePdfNow(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-base focus:ring-primary-base"
              />
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary-base" /> Générer automatiquement l&apos;Acte de Caution Bancaire officiel (PDF ReportLab)
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs border-border"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              {isSubmitting ? "Création..." : "Enregistrer la caution"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
