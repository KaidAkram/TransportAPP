"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Bus, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Vehicule } from "@/types/vehicule";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const vehicleSchema = z.object({
  immatriculation: z
    .string()
    .min(5, "L'immatriculation doit comporter au moins 5 caractères")
    .regex(/^[0-9A-Za-z\s-]+$/, "Format d'immatriculation invalide (ex: 16-123456-00)"),
  marque: z.string().min(2, "La marque est requise"),
  modele: z.string().min(2, "Le modèle est requis"),
  type: z.string().min(2, "Le type est requis"),
  nombre_places: z.coerce.number().min(1, "Au moins 1 place requise"),
  annee: z.coerce.number().min(1980).max(2035).optional().nullable(),
  date_mise_circulation: z.string().optional().nullable(),
  kilometrage_actuel: z.coerce.number().min(0, "Le kilométrage ne peut être négatif"),
  statut: z.enum(["DISPONIBLE", "EN_MISSION", "MAINTENANCE", "IMMOBILISE", "HORS_SERVICE"]),
  cout_total: z.coerce.number().min(0),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVehicle: Vehicule) => void;
}

export function AddVehicleModal({ isOpen, onClose, onSuccess }: AddVehicleModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState<VehicleFormValues | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      statut: "DISPONIBLE",
      type: "Bus",
      nombre_places: 49,
      kilometrage_actuel: 0,
      cout_total: 0,
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data: VehicleFormValues) => {
    setFormData(data);
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    try {
      setIsSubmitting(true);
      setServerError(null);
      const res = await api.post<Vehicule>("/vehicules", {
        ...formData,
        date_mise_circulation: formData.date_mise_circulation || null,
        annee: formData.annee || null,
      });

      // Upload pending files if any
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("entity_type", "vehicule");
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
      setIsConfirming(false);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création du véhicule.");
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        {/* Subtle Background Glow inside Modal */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] pointer-events-none rounded-full transition-colors duration-500 ${isConfirming ? 'bg-[var(--color-turbo)]/15' : 'bg-[var(--color-electric-violet)]/10'}`} />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors duration-500 ${isConfirming ? 'bg-[var(--color-turbo)]/20 text-[var(--color-turbo)] shadow-[0_0_15px_rgba(240,225,0,0.2)]' : 'bg-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)] shadow-[0_0_15px_rgba(131,77,251,0.2)]'}`}>
              {isConfirming ? <AlertCircle className="h-6 w-6" /> : <Bus className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-white drop-shadow-sm">
                {isConfirming ? "Vérification Requise" : "Ajouter un Véhicule"}
              </h2>
              <p className="text-xs text-white/50 mt-0.5 font-sans">
                {isConfirming ? "Veuillez confirmer les informations saisies" : "Enregistrement dans le parc automobile"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition-all"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="relative p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {serverError && !isConfirming && (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 border border-red-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mb-5">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span className="text-xs text-red-200 font-medium">{serverError}</span>
            </div>
          )}

          {isConfirming && formData ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-5 rounded-xl bg-white/5 border border-[var(--color-turbo)]/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-turbo)]" />
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  Résumé du Véhicule
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Immatriculation</p>
                    <p className="text-sm font-mono text-white">{formData.immatriculation}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Véhicule</p>
                    <p className="text-sm text-white font-medium">{formData.marque} {formData.modele} <span className="text-white/50 text-xs font-normal">({formData.type})</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Capacité & Compteur</p>
                    <p className="text-sm text-white">{formData.nombre_places} places • {formData.kilometrage_actuel} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-accent uppercase tracking-widest text-white/40 mb-1">Statut Initial</p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 text-xs font-medium text-white border border-white/5">
                      <div className={`w-1.5 h-1.5 rounded-full ${formData.statut === 'DISPONIBLE' ? 'bg-green-400' : formData.statut === 'EN_MISSION' ? 'bg-orange-400' : formData.statut === 'IMMOBILISE' ? 'bg-red-400' : 'bg-gray-400'}`} />
                      {formData.statut.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {serverError && (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 border border-red-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <span className="text-xs text-red-200 font-medium">{serverError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 border border-transparent transition-colors"
                  disabled={isSubmitting}
                >
                  Modifier la saisie
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-[var(--color-haiti)] bg-[var(--color-turbo)] hover:bg-[#ffe133] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_20px_rgba(240,225,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isSubmitting && <div className="w-3 h-3 rounded-full border-2 border-[var(--color-haiti)]/30 border-t-[var(--color-haiti)] animate-spin" />}
                  {isSubmitting ? "Création..." : "Confirmer la Création"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Immatriculation */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Immatriculation <span className="text-[var(--color-turbo)]">*</span>
                  </label>
                  <input
                    {...register("immatriculation")}
                    placeholder="ex: 16-123456-00"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all font-mono"
                  />
                  {errors.immatriculation && (
                    <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.immatriculation.message}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Type de véhicule <span className="text-[var(--color-turbo)]">*</span>
                  </label>
                  <select
                    {...register("type")}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[#251739] transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
                  >
                    <option value="Bus">Bus</option>
                    <option value="Minibus">Minibus</option>
                    <option value="Voiture">Voiture</option>
                    <option value="Van">Van / Fourgon</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {/* Marque */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Marque <span className="text-[var(--color-turbo)]">*</span>
                  </label>
                  <input
                    {...register("marque")}
                    placeholder="ex: Mercedes-Benz, Iveco"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all"
                  />
                  {errors.marque && (
                    <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.marque.message}</p>
                  )}
                </div>

                {/* Modèle */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Modèle <span className="text-[var(--color-turbo)]">*</span>
                  </label>
                  <input
                    {...register("modele")}
                    placeholder="ex: Tourismo, Crossway"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all"
                  />
                  {errors.modele && (
                    <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.modele.message}</p>
                  )}
                </div>

                {/* Nombre de places */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Nombre de places <span className="text-[var(--color-turbo)]">*</span>
                  </label>
                  <GlassNumberInput
                    {...register("nombre_places")}
                    error={!!errors.nombre_places}
                  />
                  {errors.nombre_places && (
                    <p className="text-[10px] text-red-400 mt-1.5 font-medium">{errors.nombre_places.message}</p>
                  )}
                </div>

                {/* Kilométrage actuel */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Kilométrage initial <span className="text-[var(--color-turbo)]">*</span>
                  </label>
                  <GlassNumberInput
                    step="any"
                    customStep={1000}
                    {...register("kilometrage_actuel")}
                    suffix="km"
                    error={!!errors.kilometrage_actuel}
                  />
                </div>

                {/* Année */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Année de fabrication
                  </label>
                  <GlassNumberInput
                    {...register("annee")}
                    placeholder="ex: 2026"
                  />
                </div>

                {/* Date mise en circulation */}
                <div>
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    1ère mise en circulation
                  </label>
                  <input
                    type="date"
                    {...register("date_mise_circulation")}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[#251739] transition-all cursor-pointer"
                  />
                </div>

                {/* Statut initial */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-2">
                    Statut initial
                  </label>
                  <select
                    {...register("statut")}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-[#251739] transition-all appearance-none cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1.25rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="EN_MISSION">En mission</option>
                    <option value="MAINTENANCE">En maintenance</option>
                    <option value="IMMOBILISE">Immobilisé</option>
                    <option value="HORS_SERVICE">Hors service</option>
                  </select>
                </div>
              </div>

              {/* File Upload Zone */}
              <div className="pt-2 border-t border-white/10 mt-4">
                <label className="block text-[10px] font-accent uppercase tracking-widest text-white/50 mb-3">
                  Pièces Jointes (Optionnel)
                </label>
                <CreationFileUploader
                  files={pendingFiles}
                  onFilesChange={setPendingFiles}
                  maxFiles={5}
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 border border-transparent transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--color-electric-violet)] hover:bg-[#9d6cfc] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_20px_rgba(131,77,251,0.4)] transition-all flex items-center gap-2"
                >
                  Continuer
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50 ml-1" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-70" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
