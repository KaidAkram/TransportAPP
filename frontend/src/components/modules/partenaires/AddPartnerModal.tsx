"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, X, AlertCircle, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Partenaire } from "@/types/partenaire";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";
import { GlassSelect } from "@/components/ui/GlassSelect";

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
  telephone_principal: z.string().regex(/^[\d\s\-\+\(\)]*$/, "Format invalide").or(z.literal("")).optional().nullable(),
  email: z.string().email("Email invalide").or(z.literal("")).optional().nullable(),
  site_web: z.string().url("URL invalide").or(z.literal("")).optional().nullable(),
  statut_crm: z.string(),

  // Primary contact fields
  contact_nom: z.string().optional().nullable(),
  contact_prenom: z.string().optional().nullable(),
  contact_fonction: z.string().optional().nullable(),
  contact_telephone: z.string().regex(/^[\d\s\-\+\(\)]*$/, "Format invalide").or(z.literal("")).optional().nullable(),
  contact_email: z.string().email("Email invalide").or(z.literal("")).optional().nullable(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPartner: Partenaire) => void;
}

const glassInput = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/50 focus:border-[var(--color-electric-violet)]/50 transition-all shadow-inner font-medium";
const glassInputMono = `${glassInput} font-mono`;
const glassLabel = "block text-[11px] font-accent uppercase tracking-widest text-white/50 mb-2 font-bold";

export function AddPartnerModal({ isOpen, onClose, onSuccess }: AddPartnerModalProps) {
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

  const onSubmit = async (data: PartnerFormValues) => {
    try {
      setServerError(null);
      setIsSubmitting(true);

      const contacts = [];
      if (data.contact_nom || data.contact_prenom || data.contact_email || data.contact_telephone) {
        contacts.push({
          nom: data.contact_nom || "",
          prenom: data.contact_prenom || "",
          fonction: data.contact_fonction || null,
          telephone: data.contact_telephone || null,
          email: data.contact_email || null,
          est_principal: true,
        });
      }

      const payload = {
        nom_commercial: data.nom_commercial,
        role_partenaire: data.role_partenaire,
        type_client: data.type_client || null,
        specialite: data.specialite || null,
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

      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("entity_type", "partenaire");
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
      setServerError(err.detail || "Erreur lors de l'enregistrement du partenaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{ background: 'radial-gradient(circle at top right, rgba(131,77,251,0.05), transparent 60%), rgba(255,255,255,0.02)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Nouveau Partenaire CRM</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mt-0.5">Enregistrement Client Corporate ou Fournisseur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={glassLabel}>
                Rôle Partenaire *
              </label>
              <Controller
                name="role_partenaire"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    options={[
                      { value: "CLIENT", label: "Client Commercial / Institutionnel" },
                      { value: "FOURNISSEUR", label: "Fournisseur & Prestataire" },
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
                Statut Relation CRM *
              </label>
              <Controller
                name="statut_crm"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    options={[
                      { value: "Actif", label: "Actif (En compte)" },
                      { value: "Prospect", label: "Prospect (En négociation)" },
                      { value: "Inactif", label: "Inactif" },
                      { value: "Bloqué", label: "Bloqué / Litige" },
                    ]}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Sélectionner..."
                  />
                )}
              />
            </div>
          </div>

          {/* Section 1: Informations Générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={glassLabel}>
                Raison Sociale / Nom Commercial *
              </label>
              <input
                {...register("nom_commercial")}
                placeholder="ex: Sonatrach E&P, Agence Atlas Voyages"
                className={glassInput}
              />
              {errors.nom_commercial && (
                <p className="text-[11px] text-red-400 mt-1">{errors.nom_commercial.message}</p>
              )}
            </div>

            {selectedRole === "CLIENT" ? (
              <div>
                <label className={glassLabel}>
                  Catégorie de Client
                </label>
                <Controller
                  name="type_client"
                  control={control}
                  render={({ field }) => (
                    <GlassSelect
                      options={[
                        { value: "ENTREPRISE", label: "Grande Entreprise / Corporate" },
                        { value: "AGENCE_VOYAGE", label: "Agence de Voyage / Tourisme" },
                        { value: "ORGANISME", label: "Organisme Public / Établissement" },
                        { value: "HOTEL", label: "Hôtel / Complexe Touristique" },
                        { value: "ASSOCIATION", label: "Association / Club Sportif" },
                        { value: "PARTICULIER", label: "Particulier" },
                      ]}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Sélectionner..."
                    />
                  )}
                />
              </div>
            ) : (
              <div>
                <label className={glassLabel}>
                  Spécialité / Catalogue
                </label>
                <input
                  {...register("specialite")}
                  placeholder="ex: Pneumatiques, Pièces Moteur, Carburant"
                  className={glassInput}
                />
              </div>
            )}

            <div>
              <label className={glassLabel}>
                Téléphone Standard
              </label>
              <input
                {...register("telephone_principal")}
                placeholder="ex: 021 54 70 00"
                className={glassInputMono}
              />
              {errors.telephone_principal && <p className="text-[11px] text-red-400 mt-1">{errors.telephone_principal.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>
                Email Professionnel
              </label>
              <input
                {...register("email")}
                placeholder="ex: contact@entreprise.dz"
                className={glassInput}
              />
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>
                Wilaya / Ville
              </label>
              <input
                {...register("wilaya")}
                placeholder="ex: Alger, Oran, Hassi Messaoud"
                className={glassInput}
              />
            </div>

            <div className="md:col-span-2">
              <label className={glassLabel}>
                Adresse Complète
              </label>
              <input
                {...register("adresse")}
                placeholder="ex: Zone Industrielle, Boulevard du 1er Novembre"
                className={glassInput}
              />
            </div>
          </div>

          {/* Section 2: Données Fiscales */}
          <div className="pt-2 border-t border-white/10 mt-2">
            <h3 className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Identifiants Fiscaux & Registre de Commerce
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={glassLabel}>NIF (15 chiffres)</label>
                <input
                  {...register("nif")}
                  placeholder="080016001234567"
                  className={glassInputMono}
                />
              </div>
              <div>
                <label className={glassLabel}>N° Registre Commerce (RC)</label>
                <input
                  {...register("registre_commerce")}
                  placeholder="16/00-0012345B16"
                  className={glassInputMono}
                />
              </div>
              <div>
                <label className={glassLabel}>NIS</label>
                <input
                  {...register("nis")}
                  placeholder="000016001234567000"
                  className={glassInputMono}
                />
              </div>
              <div>
                <label className={glassLabel}>Article d'Imposition</label>
                <input
                  {...register("article_imposition")}
                  placeholder="16010012345"
                  className={glassInputMono}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact Principal */}
          <div className="pt-2 border-t border-white/10 mt-2">
            <h3 className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-2">
              <Users className="h-3 w-3" />
              Interlocuteur / Contact Principal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={glassLabel}>Nom du Contact</label>
                <input
                  {...register("contact_nom")}
                  placeholder="ex: Kaddour"
                  className={glassInput}
                />
              </div>
              <div>
                <label className={glassLabel}>Prénom</label>
                <input
                  {...register("contact_prenom")}
                  placeholder="ex: Farid"
                  className={glassInput}
                />
              </div>
              <div>
                <label className={glassLabel}>Fonction / Poste</label>
                <input
                  {...register("contact_fonction")}
                  placeholder="ex: Directeur des Achats"
                  className={glassInput}
                />
              </div>
              <div>
                <label className={glassLabel}>Téléphone Direct</label>
                <input
                  {...register("contact_telephone")}
                  placeholder="ex: 0555 77 88 99"
                  className={glassInputMono}
                />
                {errors.contact_telephone && <p className="text-[11px] text-red-400 mt-1">{errors.contact_telephone.message}</p>}
              </div>
              <div>
                <label className={glassLabel}>Email Direct</label>
                <input
                  {...register("contact_email")}
                  placeholder="ex: email@entreprise.dz"
                  className={glassInput}
                />
                {errors.contact_email && <p className="text-[11px] text-red-400 mt-1">{errors.contact_email.message}</p>}
              </div>
            </div>
          </div>

          {/* File Upload Zone */}
          <div className="pt-2 border-t border-white/10 mt-2">
            <label className={glassLabel}>
              Pièces Jointes (Optionnel)
            </label>
            <CreationFileUploader 
              files={pendingFiles}
              onFilesChange={setPendingFiles} 
              maxFiles={3} 
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
              className="bg-[var(--color-electric-violet)] hover:bg-[#6A3DE8] text-white shadow-[0_0_20px_rgba(131,77,251,0.3)] hover:shadow-[0_0_30px_rgba(131,77,251,0.5)] transition-all font-bold px-6"
            >
              {isSubmitting ? "Enregistrement..." : "Ajouter le partenaire"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
