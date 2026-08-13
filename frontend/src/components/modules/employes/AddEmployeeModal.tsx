"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, X, User, Shield, Wrench, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Employe } from "@/types/employe";

const employeSchema = z.object({
  matricule: z.string().min(3, "Matricule requis (ex: CH-002, MEC-003)"),
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  type_employe: z.enum(["CHAUFFEUR", "MECANICIEN", "ADMINISTRATIF"]),
  telephone: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  date_naissance: z.string().optional().nullable(),
  date_embauche: z.string().optional().nullable(),
  statut: z.enum(["ACTIF", "ABSENT", "SUSPENDU", "QUITTE"]),
  fonction: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),

  // Chauffeur specific
  assurance: z.boolean().optional(),
  permis_numero: z.string().optional().nullable(),
  permis_categories: z.string().optional().nullable(),
  permis_date_obtention: z.string().optional().nullable(),
  permis_date_expiration: z.string().optional().nullable(),

  // Mecanicien specific
  specialite: z.string().optional().nullable(),
  type_mecanicien: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  est_responsable: z.boolean().optional(),
});

type EmployeFormValues = z.infer<typeof employeSchema>;

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmploye: Employe) => void;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EmployeFormValues>({
    resolver: zodResolver(employeSchema),
    defaultValues: {
      type_employe: "CHAUFFEUR",
      statut: "ACTIF",
      assurance: true,
      permis_categories: "B, D, D1",
      est_responsable: false,
    },
  });

  const selectedType = watch("type_employe");

  if (!isOpen) return null;

  const onSubmit = async (data: EmployeFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // Auto-assign professional avatar if not provided
      let photoUrl = data.photo;
      if (!photoUrl) {
        photoUrl =
          data.type_employe === "CHAUFFEUR"
            ? "/assets/avatars/driver_pro.jpg"
            : "/assets/avatars/mechanic_pro.jpg";
      }

      const payload = {
        ...data,
        photo: photoUrl,
        date_naissance: data.date_naissance || null,
        date_embauche: data.date_embauche || null,
        permis_date_obtention: data.permis_date_obtention || null,
        permis_date_expiration: data.permis_date_expiration || null,
      };

      const res = await api.post<Employe>("/employes", payload);
      reset();
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création du collaborateur.");
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
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Nouveau Collaborateur</h2>
              <p className="text-xs text-text-secondary">Enregistrement RH Chauffeur ou Mécanicien</p>
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

          {/* Section 1: Rôle & Type (Triggers Dynamic Fields) */}
          <div className="rounded-lg border border-border bg-primary-light/10 p-3">
            <label className="block text-xs font-bold text-primary-base mb-1">
              Catégorie de Collaborateur *
            </label>
            <select
              {...register("type_employe")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            >
              <option value="CHAUFFEUR">🪪 Chauffeur Professionnel</option>
              <option value="MECANICIEN">🔧 Mécanicien / Chef d&apos;Atelier</option>
              <option value="ADMINISTRATIF">📋 Personnel Administratif</option>
            </select>
          </div>

          {/* Section 2: Données Communes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Matricule RH *
              </label>
              <input
                {...register("matricule")}
                placeholder={selectedType === "CHAUFFEUR" ? "ex: CH-005" : "ex: MEC-004"}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.matricule && <p className="text-[11px] text-danger mt-1">{errors.matricule.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Statut d&apos;Activité RH *
              </label>
              <select
                {...register("statut")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="ACTIF">🟢 Actif</option>
                <option value="ABSENT">🟠 Absent / En Congé</option>
                <option value="SUSPENDU">🔴 Suspendu</option>
                <option value="QUITTE">⚪ Quitté / Archivé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Nom *</label>
              <input
                {...register("nom")}
                placeholder="ex: Belkacem"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.nom && <p className="text-[11px] text-danger mt-1">{errors.nom.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Prénom *</label>
              <input
                {...register("prenom")}
                placeholder="ex: Rachid"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
              {errors.prenom && <p className="text-[11px] text-danger mt-1">{errors.prenom.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Téléphone</label>
              <input
                {...register("telephone")}
                placeholder="ex: 0550 12 34 56"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Fonction / Intitulé</label>
              <input
                {...register("fonction")}
                placeholder={selectedType === "CHAUFFEUR" ? "Chauffeur Longue Distance" : "Électromécanicien"}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Date d&apos;embauche</label>
              <input
                type="date"
                {...register("date_embauche")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Date de naissance</label>
              <input
                type="date"
                {...register("date_naissance")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Adresse de résidence</label>
            <input
              {...register("adresse")}
              placeholder="ex: Cité 500 Logements, Oran"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
            />
          </div>

          {/* DYNAMIC SECTION: CHAUFFEUR SPECIFICS */}
          {selectedType === "CHAUFFEUR" && (
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <h3 className="text-xs font-bold text-primary-base flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Permis de Conduire & Assurance Chauffeur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    N° Permis de Conduire
                  </label>
                  <input
                    {...register("permis_numero")}
                    placeholder="ex: DZ-31-123456"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Catégories (séparées par virgules)
                  </label>
                  <input
                    {...register("permis_categories")}
                    placeholder="ex: B, D, D1"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Date d&apos;obtention
                  </label>
                  <input
                    type="date"
                    {...register("permis_date_obtention")}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Date d&apos;expiration
                  </label>
                  <input
                    type="date"
                    {...register("permis_date_expiration")}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("assurance")}
                    className="h-4 w-4 rounded border-border text-primary-base focus:ring-primary-base"
                  />
                  <span className="text-xs font-medium text-text-primary">
                    Assurance Chauffeur Professionnel active et valide
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* DYNAMIC SECTION: MECANICIEN SPECIFICS */}
          {selectedType === "MECANICIEN" && (
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <h3 className="text-xs font-bold text-primary-base flex items-center gap-1.5">
                <Wrench className="h-4 w-4" /> Spécialité & Compétences Atelier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Spécialité Technique
                  </label>
                  <input
                    {...register("specialite")}
                    placeholder="ex: Freinage Pneumatique, Moteur Euro 6, Électricité"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Grade / Niveau
                  </label>
                  <input
                    {...register("type_mecanicien")}
                    placeholder="ex: Chef d'Atelier, Technicien Supérieur, Apprenti"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    Années d&apos;expérience
                  </label>
                  <input
                    {...register("experience")}
                    placeholder="ex: 12 ans"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("est_responsable")}
                      className="h-4 w-4 rounded border-border text-primary-base focus:ring-primary-base"
                    />
                    <span className="text-xs font-medium text-text-primary">
                      Habilité Chef d&apos;équipe / Responsable d&apos;Atelier
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

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
              {isSubmitting ? "Enregistrement..." : "Créer le collaborateur"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
