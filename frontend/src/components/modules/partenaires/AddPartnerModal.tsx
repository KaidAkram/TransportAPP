"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, X, AlertCircle, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Partenaire } from "@/types/partenaire";

const partnerSchema = z.object({
  nom_commercial: z.string().min(2, "La raison sociale ou nom commercial est requis"),
  role_partenaire: z.enum(["CLIENT", "FOURNISSEUR", "PARTENAIRE_MIXTE"]),
  type_client: z.string().optional().nullable(),
  specialite: z.string().optional().nullable(),
  nif: z.string().optional().nullable(),
  nis: z.string().optional().nullable(),
  registre_commerce: z.string().optional().nullable(),
  article_imposition: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  wilaya: z.string().optional().nullable(),
  telephone_principal: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  site_web: z.string().optional().nullable(),
  statut_crm: z.string(),

  // Primary contact fields
  contact_nom: z.string().optional().nullable(),
  contact_prenom: z.string().optional().nullable(),
  contact_fonction: z.string().optional().nullable(),
  contact_telephone: z.string().optional().nullable(),
  contact_email: z.string().optional().nullable(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPartner: Partenaire) => void;
}

export function AddPartnerModal({ isOpen, onClose, onSuccess }: AddPartnerModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      role_partenaire: "CLIENT",
      type_client: "ENTREPRISE",
      statut_crm: "Actif",
    },
  });

  const selectedRole = watch("role_partenaire");

  if (!isOpen) return null;

  const onSubmit = async (data: PartnerFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // Build payload with nested contact if provided
      const contacts = [];
      if (data.contact_nom && data.contact_prenom) {
        contacts.push({
          nom: data.contact_nom.trim(),
          prenom: data.contact_prenom.trim(),
          fonction: data.contact_fonction || null,
          telephone: data.contact_telephone || null,
          email: data.contact_email || null,
          est_principal: true,
        });
      }

      const defaultLogo =
        data.role_partenaire === "CLIENT"
          ? "/assets/logos/client_default.jpg"
          : "/assets/logos/supplier_default.jpg";

      const payload = {
        nom_commercial: data.nom_commercial.trim(),
        logo: defaultLogo,
        role_partenaire: data.role_partenaire,
        type_client: data.role_partenaire === "CLIENT" ? data.type_client : null,
        specialite: data.role_partenaire === "FOURNISSEUR" ? data.specialite : null,
        nif: data.nif || null,
        nis: data.nis || null,
        registre_commerce: data.registre_commerce || null,
        article_imposition: data.article_imposition || null,
        adresse: data.adresse || null,
        wilaya: data.wilaya || null,
        telephone_principal: data.telephone_principal || null,
        email: data.email || null,
        site_web: data.site_web || null,
        statut_crm: data.statut_crm || "Actif",
        contacts,
      };

      const res = await api.post<Partenaire>("/partenaires", payload);
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de l'enregistrement du partenaire.");
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
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nouveau Partenaire CRM</h2>
              <p className="text-xs text-text-secondary">Enregistrement Client Corporate ou Fournisseur</p>
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

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary-base mb-1">
                Rôle Partenaire *
              </label>
              <select
                {...register("role_partenaire")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="CLIENT">🏢 Client Commercial / Institutionnel</option>
                <option value="FOURNISSEUR">🏭 Fournisseur & Prestataire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Statut Relation CRM *
              </label>
              <select
                {...register("statut_crm")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="Actif">🟢 Actif (En compte)</option>
                <option value="Prospect">🟡 Prospect (En négociation)</option>
                <option value="Inactif">⚫ Inactif</option>
                <option value="Bloqué">🔴 Bloqué / Litige</option>
              </select>
            </div>
          </div>

          {/* Section 1: Informations Générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Raison Sociale / Nom Commercial *
              </label>
              <input
                {...register("nom_commercial")}
                placeholder="ex: Sonatrach E&P, Agence Atlas Voyages"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.nom_commercial && (
                <p className="text-[11px] text-danger mt-1">{errors.nom_commercial.message}</p>
              )}
            </div>

            {selectedRole === "CLIENT" ? (
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Catégorie de Client
                </label>
                <select
                  {...register("type_client")}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                >
                  <option value="ENTREPRISE">Grande Entreprise / Corporate</option>
                  <option value="AGENCE_VOYAGE">Agence de Voyage / Tourisme</option>
                  <option value="ORGANISME">Organisme Public / Établissement</option>
                  <option value="HOTEL">Hôtel / Complexe Touristique</option>
                  <option value="ASSOCIATION">Association / Club Sportif</option>
                  <option value="PARTICULIER">Particulier</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Spécialité / Catalogue
                </label>
                <input
                  {...register("specialite")}
                  placeholder="ex: Pneumatiques, Pièces Moteur, Carburant"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Téléphone Standard
              </label>
              <input
                {...register("telephone_principal")}
                placeholder="ex: 021 54 70 00"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Email Professionnel
              </label>
              <input
                {...register("email")}
                placeholder="ex: contact@entreprise.dz"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Wilaya / Ville
              </label>
              <input
                {...register("wilaya")}
                placeholder="ex: Alger, Oran, Hassi Messaoud"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Adresse Complète
              </label>
              <input
                {...register("adresse")}
                placeholder="ex: Zone Industrielle, Boulevard du 1er Novembre"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          {/* Section 2: Identifiants Fiscaux & Juridiques (Algérie) */}
          <div className="rounded-lg border border-border bg-table-header p-4 space-y-3">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary-base" /> Identifiants Fiscaux & Registre de Commerce
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">NIF (15 chiffres)</label>
                <input
                  {...register("nif")}
                  placeholder="000016001234567"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">N° Registre Commerce (RC)</label>
                <input
                  {...register("registre_commerce")}
                  placeholder="16/00-0012345B16"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">NIS</label>
                <input
                  {...register("nis")}
                  placeholder="000016001234567000"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">Article d&apos;Imposition</label>
                <input
                  {...register("article_imposition")}
                  placeholder="16010012345"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Interlocuteur Principal */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary-base" /> Interlocuteur / Contact Principal
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">Nom du Contact</label>
                <input
                  {...register("contact_nom")}
                  placeholder="ex: Mansouri"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">Prénom</label>
                <input
                  {...register("contact_prenom")}
                  placeholder="ex: Farid"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">Fonction / Poste</label>
                <input
                  {...register("contact_fonction")}
                  placeholder="ex: Directeur des Achats"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">Téléphone Direct</label>
                <input
                  {...register("contact_telephone")}
                  placeholder="ex: 0555 77 88 99"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer le partenaire"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
