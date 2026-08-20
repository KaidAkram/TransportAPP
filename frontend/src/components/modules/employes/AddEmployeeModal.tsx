"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, X, Shield, Wrench, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Employe } from "@/types/employe";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";
import { GlassSelect } from "@/components/ui/GlassSelect";

const employeSchema = z.object({
  matricule: z.string().optional(),
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  type_employe: z.enum(["CHAUFFEUR", "MECANICIEN", "ADMINISTRATIF"]),
  telephone: z.string().regex(/^[\d\s\-\+\(\)]*$/, "Format invalide").or(z.literal("")).optional().nullable(),
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

// Reusable glass input class
const glassInput = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all";
const glassInputMono = `${glassInput} font-mono`;
const glassInputDate = `${glassInput} [color-scheme:dark]`;
const glassSelect = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all appearance-none cursor-pointer [color-scheme:dark]";
const glassLabel = "block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2";

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File[]>([]);
  const [naissanceFile, setNaissanceFile] = useState<File[]>([]);
  const [cniFile, setCniFile] = useState<File[]>([]);
  const [residenceFile, setResidenceFile] = useState<File[]>([]);
  const [chifaFile, setChifaFile] = useState<File[]>([]);
  const [casierFile, setCasierFile] = useState<File[]>([]);
  const [permisFile, setPermisFile] = useState<File[]>([]);
  const [autreFile, setAutreFile] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
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

  useEffect(() => {
    if (isOpen) {
      setValue("matricule", "");
    }
  }, [isOpen, setValue]);

  const selectedType = watch("type_employe");

  if (!mounted || !isOpen) return null;

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
        matricule: data.matricule?.trim() || undefined,
        photo: photoUrl,
        date_naissance: data.date_naissance || null,
        date_embauche: data.date_embauche || null,
        permis_date_obtention: data.permis_date_obtention || null,
        permis_date_expiration: data.permis_date_expiration || null,
      };

      const res = await api.post<Employe>("/employes", payload);

      // Upload pending files if any
      const filesToUpload = [
        { file: photoFile[0], type: "Photo" },
        { file: naissanceFile[0], type: "Extrait de naissance" },
        { file: cniFile[0], type: "CNI" },
        { file: residenceFile[0], type: "Justificatif de résidence" },
        { file: chifaFile[0], type: "Carte Chifa" },
        { file: casierFile[0], type: "Casier Judiciaire" },
        { file: permisFile[0], type: "Permis de conduire" },
        { file: autreFile[0], type: "Autre" }
      ].filter(item => item.file);

      if (filesToUpload.length > 0) {
        for (const item of filesToUpload) {
          const uploadData = new FormData();
          uploadData.append("file", item.file);
          uploadData.append("entity_type", "employe");
          uploadData.append("entity_id", res.data.id);
          uploadData.append("document_type", item.type);
          uploadData.append("nom", item.type);
          try {
            await api.post("/upload", uploadData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (uploadErr) {
            console.error("Failed to upload file:", item.file.name, uploadErr);
          }
        }
      }

      reset();
      setPhotoFile([]);
      setNaissanceFile([]);
      setCniFile([]);
      setResidenceFile([]);
      setChifaFile([]);
      setCasierFile([]);
      setPermisFile([]);
      setAutreFile([]);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création du collaborateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white tracking-tight">Nouveau Collaborateur</h2>
              <p className="text-[10px] font-accent uppercase tracking-widest text-[var(--color-turbo)] mt-0.5">Enregistrement RH Chauffeur ou Mécanicien</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="relative p-6 space-y-5 overflow-y-auto">
          {serverError && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 p-4 border border-rose-500/20">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span className="text-xs text-rose-200 font-medium">{serverError}</span>
            </div>
          )}

          {/* Section 1: Rôle & Type */}
          <div className="rounded-xl border border-[var(--color-electric-violet)]/20 bg-[var(--color-electric-violet)]/5 p-4">
            <label className="block text-[10px] font-accent uppercase tracking-widest text-[var(--color-electric-violet)] mb-2">
              Catégorie de Collaborateur <span className="text-rose-400">*</span>
            </label>
            <Controller
              name="type_employe"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "CHAUFFEUR", label: "Chauffeur Professionnel" },
                    { value: "MECANICIEN", label: "Mécanicien / Chef d'Atelier" },
                    { value: "ADMINISTRATIF", label: "Personnel Administratif" },
                  ]}
                />
              )}
            />
          </div>

          {/* Section 2: Données Communes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={glassLabel}>
                Matricule RH
              </label>
              <input
                {...register("matricule")}
                placeholder={selectedType === "CHAUFFEUR" ? "Auto: CHF-XXX" : selectedType === "MECANICIEN" ? "Auto: MEC-XXX" : "Auto: ADM-XXX"}
                className={glassInputMono}
              />
              {errors.matricule && <p className="text-[11px] text-rose-400 mt-1.5">{errors.matricule.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>
                Statut d&apos;Activité RH <span className="text-rose-400">*</span>
              </label>
              <Controller
                name="statut"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "ACTIF", label: "Actif" },
                      { value: "ABSENT", label: "Absent / En Congé" },
                      { value: "SUSPENDU", label: "Suspendu" },
                      { value: "QUITTE", label: "Quitté / Archivé" },
                    ]}
                  />
                )}
              />
            </div>

            <div>
              <label className={glassLabel}>Nom <span className="text-rose-400">*</span></label>
              <input
                {...register("nom")}
                placeholder="ex: Belkacem"
                className={glassInput}
              />
              {errors.nom && <p className="text-[11px] text-rose-400 mt-1.5">{errors.nom.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>Prénom <span className="text-rose-400">*</span></label>
              <input
                {...register("prenom")}
                placeholder="ex: Rachid"
                className={glassInput}
              />
              {errors.prenom && <p className="text-[11px] text-rose-400 mt-1.5">{errors.prenom.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>Téléphone</label>
              <input
                {...register("telephone")}
                placeholder="ex: 0550 12 34 56"
                className={glassInputMono}
              />
              {errors.telephone && <p className="text-[11px] text-rose-400 mt-1.5">{errors.telephone.message}</p>}
            </div>

            <div>
              <label className={glassLabel}>Fonction / Intitulé</label>
              <input
                {...register("fonction")}
                placeholder={selectedType === "CHAUFFEUR" ? "Chauffeur Longue Distance" : "Électromécanicien"}
                className={glassInput}
              />
            </div>

            <div>
              <label className={glassLabel}>Date d&apos;embauche</label>
              <input
                type="date"
                {...register("date_embauche")}
                className={glassInputDate}
              />
            </div>

            <div>
              <label className={glassLabel}>Date de naissance</label>
              <input
                type="date"
                {...register("date_naissance")}
                className={glassInputDate}
              />
            </div>
          </div>

          <div>
            <label className={glassLabel}>Adresse de résidence</label>
            <input
              {...register("adresse")}
              placeholder="ex: Cité 500 Logements, Oran"
              className={glassInput}
            />
          </div>

          {/* DYNAMIC SECTION: CHAUFFEUR SPECIFICS */}
          {selectedType === "CHAUFFEUR" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-xs font-bold text-[var(--color-electric-violet)] flex items-center gap-2">
                <Shield className="h-4 w-4" /> Permis de Conduire & Assurance Chauffeur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={glassLabel}>N° Permis de Conduire</label>
                  <input
                    {...register("permis_numero")}
                    placeholder="ex: DZ-31-123456"
                    className={glassInputMono}
                  />
                </div>

                <div>
                  <label className={glassLabel}>Catégories (séparées par virgules)</label>
                  <input
                    {...register("permis_categories")}
                    placeholder="ex: B, D, D1"
                    className={glassInputMono}
                  />
                </div>

                <div>
                  <label className={glassLabel}>Date d&apos;obtention</label>
                  <input
                    type="date"
                    {...register("permis_date_obtention")}
                    className={glassInputDate}
                  />
                </div>

                <div>
                  <label className={glassLabel}>Date d&apos;expiration</label>
                  <input
                    type="date"
                    {...register("permis_date_expiration")}
                    className={glassInputDate}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      {...register("assurance")}
                      className="peer appearance-none h-5 w-5 rounded-md border-2 border-white/20 bg-white/5 checked:bg-[var(--color-electric-violet)] checked:border-[var(--color-electric-violet)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/30"
                    />
                    <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    Assurance Chauffeur Professionnel active et valide
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* DYNAMIC SECTION: MECANICIEN SPECIFICS */}
          {selectedType === "MECANICIEN" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-xs font-bold text-[var(--color-electric-violet)] flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Spécialité & Compétences Atelier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={glassLabel}>Spécialité Technique</label>
                  <input
                    {...register("specialite")}
                    placeholder="ex: Freinage Pneumatique, Moteur Euro 6"
                    className={glassInput}
                  />
                </div>

                <div>
                  <label className={glassLabel}>Grade / Niveau</label>
                  <input
                    {...register("type_mecanicien")}
                    placeholder="ex: Chef d'Atelier, Technicien Supérieur"
                    className={glassInput}
                  />
                </div>

                <div>
                  <label className={glassLabel}>Années d&apos;expérience</label>
                  <input
                    {...register("experience")}
                    placeholder="ex: 12 ans"
                    className={glassInput}
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        {...register("est_responsable")}
                        className="peer appearance-none h-5 w-5 rounded-md border-2 border-white/20 bg-white/5 checked:bg-[var(--color-electric-violet)] checked:border-[var(--color-electric-violet)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-violet)]/30"
                      />
                      <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                      Chef d&apos;équipe / Responsable
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Zone */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div>
              <label className={glassLabel}>Photo de profil (Optionnel, sera placée au dessus)</label>
              <CreationFileUploader files={photoFile} onFilesChange={setPhotoFile} maxFiles={1} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={glassLabel}>Extrait de Naissance</label>
                <CreationFileUploader files={naissanceFile} onFilesChange={setNaissanceFile} maxFiles={1} />
              </div>
              <div>
                <label className={glassLabel}>CNI (Carte Nationale d&apos;Identité)</label>
                <CreationFileUploader files={cniFile} onFilesChange={setCniFile} maxFiles={1} />
              </div>
              <div>
                <label className={glassLabel}>Justificatif de Résidence</label>
                <CreationFileUploader files={residenceFile} onFilesChange={setResidenceFile} maxFiles={1} />
              </div>
              <div>
                <label className={glassLabel}>Carte Chifa</label>
                <CreationFileUploader files={chifaFile} onFilesChange={setChifaFile} maxFiles={1} />
              </div>
              <div>
                <label className={glassLabel}>Casier Judiciaire</label>
                <CreationFileUploader files={casierFile} onFilesChange={setCasierFile} maxFiles={1} />
              </div>
              {selectedType === "CHAUFFEUR" && (
                <div>
                  <label className={glassLabel}>Permis de conduire</label>
                  <CreationFileUploader files={permisFile} onFilesChange={setPermisFile} maxFiles={1} />
                </div>
              )}
              <div>
                <label className={glassLabel}>Autre document (Optionnel)</label>
                <CreationFileUploader files={autreFile} onFilesChange={setAutreFile} maxFiles={1} />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[var(--color-electric-violet)]/90 hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Enregistrement..." : "Créer le collaborateur"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
