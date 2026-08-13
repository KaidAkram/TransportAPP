"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, X, AlertCircle, Building2, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Contrat } from "@/types/contrat";
import { Partenaire, PartenaireListResponse } from "@/types/partenaire";

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

export function AddContractModal({ isOpen, onClose, onSuccess }: AddContractModalProps) {
  const [partners, setPartners] = useState<Partenaire[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
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

  if (!isOpen) return null;

  const onSubmit = async (data: ContractFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await api.post<Contrat>("/contrats", {
        ...data,
        montant: Number(data.montant),
      });
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création du contrat.");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-base">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nouveau Contrat Commercial</h2>
              <p className="text-xs text-text-secondary">Convention de transport, location ou prestation de service</p>
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
                Référence Contrat *
              </label>
              <input
                {...register("reference")}
                placeholder="ex: CTR-2026-001"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.reference && (
                <p className="text-[11px] text-danger mt-1">{errors.reference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Partenaire Contractant *
              </label>
              <select
                {...register("partenaire_id")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Sélectionner une entreprise...</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom_commercial} ({p.role_partenaire === "CLIENT" ? "Client" : "Fournisseur"})
                  </option>
                ))}
              </select>
              {errors.partenaire_id && (
                <p className="text-[11px] text-danger mt-1">{errors.partenaire_id.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Objet de la Convention *
              </label>
              <input
                {...register("objet")}
                placeholder="ex: Convention de transport de personnel sur le site industriel de Hassi Messaoud"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.objet && <p className="text-[11px] text-danger mt-1">{errors.objet.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Type de Contrat
              </label>
              <select
                {...register("type_contrat")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="Transport">Transport Régulier / Navettes</option>
                <option value="Tourisme">Circuits Touristiques & Voyages</option>
                <option value="Location">Location d&apos;Autocars avec Chauffeur</option>
                <option value="Fourniture">Fourniture de Pièces & Consommables</option>
                <option value="Maintenance">Prestation de Maintenance Spécialisée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Statut Contractuel
              </label>
              <select
                {...register("statut")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="ACTIF">🟢 Contrat Actif</option>
                <option value="EXPIRE">🔴 Expiré / Clôturé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date d&apos;Effet (Début) *
              </label>
              <input
                type="date"
                {...register("date_debut")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.date_debut && (
                <p className="text-[11px] text-danger mt-1">{errors.date_debut.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Date d&apos;Échéance (Fin) *
              </label>
              <input
                type="date"
                {...register("date_fin")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.date_fin && (
                <p className="text-[11px] text-danger mt-1">{errors.date_fin.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Montant Global HT (DZD) *
              </label>
              <input
                type="number"
                step="1000"
                {...register("montant", { valueAsNumber: true })}
                placeholder="15000000"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.montant && (
                <p className="text-[11px] text-danger mt-1">{errors.montant.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Mode de Facturation
              </label>
              <select
                {...register("mode_facturation")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="Mensuel">Facturation Mensuelle</option>
                <option value="Au voyage">Au Voyage / Rotation</option>
                <option value="Forfait">Forfaitaire Global</option>
                <option value="Par kilomètre">Au Kilomètre Parcouru</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Conditions de Paiement & Modalités
              </label>
              <input
                {...register("conditions_paiement")}
                placeholder="ex: Virement bancaire BNA à 30 jours fin de mois après service fait"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
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
              {isSubmitting ? "Création..." : "Enregistrer le contrat"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
