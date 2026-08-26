"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wrench, X, AlertCircle, Plus, Trash2, Package, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Intervention } from "@/types/intervention";
import { Vehicule, VehiculeListResponse } from "@/types/vehicule";
import { Employe, EmployeListResponse } from "@/types/employe";
import { Piece, PieceListResponse } from "@/types/stock";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { GlassNumberInput } from "@/components/ui/GlassNumberInput";
import { CreationFileUploader } from "@/components/shared/CreationFileUploader";

const pieceUsageSchema = z.object({
  piece_id: z.string().min(1, "Veuillez sélectionner une pièce"),
  quantite: z.coerce.number().min(1, "La quantité doit être >= 1"),
});

const interventionSchema = z.object({
  numero: z.string().min(2, "Le numéro d'ordre de travail est requis"),
  vehicule_id: z.string().min(1, "Veuillez sélectionner un véhicule"),
  mecanicien_responsable_id: z.string().optional().nullable(),
  type: z.enum(["PREVENTIVE", "CORRECTIVE"]),
  categorie: z.string().min(1, "La catégorie de travaux est requise"),
  date: z.string().min(1, "La date est requise"),
  kilometrage: z.coerce.number().min(0, "Le kilométrage doit être positif"),
  probleme_constate: z.string().optional().nullable(),
  diagnostic: z.string().optional().nullable(),
  travail_effectue: z.string().optional().nullable(),
  cout_main_doeuvre: z.coerce.number().min(0, "Le coût doit être positif"),
  prochaine_date_maintenance: z.string().optional().nullable(),
  prochain_kilo_maintenance: z.coerce.number().optional().nullable(),
  statut: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]),
  pieces_utilisees: z.array(pieceUsageSchema).optional(),
});

type InterventionFormValues = z.infer<typeof interventionSchema>;

interface AddInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newIntervention: Intervention) => void;
  defaultVehiculeId?: string;
  defaultMecanicienId?: string;
}

export function AddInterventionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultVehiculeId,
  defaultMecanicienId,
}: AddInterventionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicule[]>([]);
  const [mechanics, setMechanics] = useState<Employe[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState<InterventionFormValues | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InterventionFormValues>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      numero: "",
      type: "PREVENTIVE",
      categorie: "Freinage & Révision",
      date: new Date().toISOString().split("T")[0],
      kilometrage: 0,
      cout_main_doeuvre: 0,
      statut: "TERMINEE",
      vehicule_id: defaultVehiculeId || "",
      mecanicien_responsable_id: defaultMecanicienId || "",
      pieces_utilisees: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pieces_utilisees",
  });

  const watchPieces = watch("pieces_utilisees");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      api
        .get<VehiculeListResponse>("/vehicules", { per_page: "100" })
        .then((res) => setVehicles(res.data.items))
        .catch(console.error);

      api
        .get<EmployeListResponse>("/employes", { type_employe: "MECANICIEN", per_page: "100" })
        .then((res) => setMechanics(res.data.items))
        .catch(console.error);

      api
        .get<PieceListResponse>("/stock/pieces", { per_page: "100" })
        .then((res) => setPieces(res.data.items))
        .catch(console.error);

      api
        .get("/utils/next-sequence", { params: { entity: "intervention" } })
        .then((res: any) => {
          if (res.data?.next) setValue("numero", res.data.next);
        })
        .catch(console.error);

      if (defaultVehiculeId) setValue("vehicule_id", defaultVehiculeId);
      if (defaultMecanicienId) setValue("mecanicien_responsable_id", defaultMecanicienId);
    } else {
      document.body.style.overflow = "unset";
      setIsConfirming(false);
      setServerError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, defaultVehiculeId, defaultMecanicienId, setValue]);

  if (!mounted || !isOpen) return null;

  const onSubmit = (data: InterventionFormValues) => {
    setFormData(data);
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        ...formData,
        kilometrage: Number(formData.kilometrage),
        cout_main_doeuvre: Number(formData.cout_main_doeuvre),
        prochain_kilo_maintenance: formData.prochain_kilo_maintenance
          ? Number(formData.prochain_kilo_maintenance)
          : null,
        prochaine_date_maintenance: formData.prochaine_date_maintenance || null,
        mecanicien_responsable_id: formData.mecanicien_responsable_id || null,
        pieces_utilisees: (formData.pieces_utilisees || []).map((p) => ({
          piece_id: p.piece_id,
          quantite: Number(p.quantite),
        })),
      };

      const res = await api.post<Intervention>("/interventions", payload);

      // Upload pending files if any
      if (documents.length > 0) {
        for (const file of documents) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("entity_type", "intervention");
          uploadData.append("entity_id", res.data.id);
          uploadData.append("document_type", "Document Attaché");
          uploadData.append("nom", file.name);
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
      setDocuments([]);
      setIsConfirming(false);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setServerError(err.detail || "Erreur lors de la création de l'intervention.");
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVehicle = formData ? vehicles.find(v => v.id === formData.vehicule_id) : null;
  const selectedMechanic = formData && formData.mecanicien_responsable_id ? mechanics.find(m => m.id === formData.mecanicien_responsable_id) : null;

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[var(--color-electric-violet)] focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:outline-none transition-all";
  const labelClass = "block text-[11px] font-accent uppercase tracking-wider text-white/50 mb-1.5 font-bold";

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-haiti)]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl glass-panel border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Subtle Background Glow inside Modal */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] pointer-events-none rounded-full transition-colors duration-500 ${isConfirming ? 'bg-emerald-500/15' : 'bg-[var(--color-electric-violet)]/10'}`} />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              isConfirming ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-[var(--color-electric-violet)]/10 border-[var(--color-electric-violet)]/20 text-[var(--color-electric-violet)]'
            }`}>
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                {isConfirming ? "Confirmation de l'Intervention" : "Nouvel Ordre de Travail"}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {isConfirming 
                  ? "Veuillez vérifier les informations et les pièces avant validation" 
                  : "Planifier ou enregistrer une opération de maintenance"}
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto relative z-10 flex-1 custom-scrollbar">
          {!isConfirming ? (
            <form id="add-intervention-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Type, Categorie, Statut */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Type d'Intervention</label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "PREVENTIVE", label: "Préventive (Révision)" },
                          { value: "CORRECTIVE", label: "Corrective (Panne)" },
                        ]}
                      />
                    )}
                  />
                  {errors.type && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.type.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Catégorie</label>
                  <input
                    {...register("categorie")}
                    placeholder="Ex: Freinage, Moteur..."
                    className={inputClass}
                  />
                  {errors.categorie && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.categorie.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Statut Actuel</label>
                  <Controller
                    name="statut"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "PLANIFIEE", label: "Planifiée (À venir)" },
                          { value: "EN_COURS", label: "En Cours (Atelier)" },
                          { value: "TERMINEE", label: "Terminée (OK)" },
                        ]}
                      />
                    )}
                  />
                  {errors.statut && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.statut.message}</p>}
                </div>
              </div>

              {/* Véhicule & Mécano */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Véhicule</label>
                  <Controller
                    name="vehicule_id"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Sélectionner un véhicule..." },
                          ...vehicles.map(v => ({ value: v.id, label: `${v.immatriculation} - ${v.modele}` }))
                        ]}
                      />
                    )}
                  />
                  {errors.vehicule_id && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.vehicule_id.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Responsable / Mécanicien</label>
                  <Controller
                    name="mecanicien_responsable_id"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Non assigné..." },
                          ...mechanics.map(m => ({ value: m.id, label: `${m.nom} ${m.prenom}` }))
                        ]}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Dates & KMs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Numéro O.T</label>
                  <input
                    {...register("numero")}
                    placeholder="Ex: INT-2026-..."
                    className={inputClass}
                  />
                  {errors.numero && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.numero.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Date intervention</label>
                  <input
                    type="date"
                    {...register("date")}
                    className={inputClass}
                  />
                  {errors.date && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.date.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Kilométrage actuel</label>
                  <Controller
                    name="kilometrage"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        suffix="KM"
                      />
                    )}
                  />
                  {errors.kilometrage && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.kilometrage.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Coût Main d'Œuvre</label>
                  <Controller
                    name="cout_main_doeuvre"
                    control={control}
                    render={({ field }) => (
                      <GlassNumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        step="any"
                        suffix="DZD"
                      />
                    )}
                  />
                  {errors.cout_main_doeuvre && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errors.cout_main_doeuvre.message}</p>}
                </div>
              </div>

              {/* Estimate Pièces */}
              {watchPieces && watchPieces.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center text-sm">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Coût estimé des pièces (PUMP)</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    {watchPieces.reduce((total, p) => total + ((pieces.find(x => x.id === p.piece_id)?.prix_unitaire_moyen || 0) * (p.quantite || 0)), 0).toLocaleString()} DZD
                  </span>
                </div>
              )}

              {/* Détails */}
              <div>
                <label className={labelClass}>Détails des travaux & Diagnostic</label>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    {...register("probleme_constate")}
                    placeholder="Problème constaté par le chauffeur..."
                    className={inputClass}
                  />
                  <input
                    {...register("diagnostic")}
                    placeholder="Diagnostic du mécanicien..."
                    className={inputClass}
                  />
                  <textarea
                    {...register("travail_effectue")}
                    placeholder="Détail du travail effectué (pièces changées, réglages)..."
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                  {/* Documents */}
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Documents Attachés (Optionnel)
                  </h3>
                </div>
                <div className="p-4">
                  <CreationFileUploader
                    files={documents}
                    onFilesChange={setDocuments}
                    maxFiles={10}
                  />
                </div>
              </div>
              </div>

              {/* Pièces Consommées */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Package className="h-4 w-4 text-[var(--color-turbo)]" />
                      Pièces Consommées
                    </h3>
                    <p className="text-[10px] text-white/50 mt-0.5">Ajoutez les pièces du stock utilisées (diminuera leur quantité disponible)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => append({ piece_id: "", quantite: 1 })}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-turbo)]/10 text-[var(--color-turbo)] hover:bg-[var(--color-turbo)]/20 transition-colors border border-[var(--color-turbo)]/20"
                  >
                    + Ajouter Pièce
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40">Aucune pièce du stock sélectionnée.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      // Retrieve price of selected piece to estimate cost dynamically
                      const currentPieceId = watchPieces?.[index]?.piece_id;
                      const selectedPieceDetails = pieces.find(p => p.id === currentPieceId);
                      
                      return (
                      <div key={field.id} className="flex flex-col sm:flex-row items-center gap-2 bg-[var(--color-haiti)] p-2 rounded-xl border border-white/10">
                        <div className="flex-1 w-full">
                          <Controller
                            name={`pieces_utilisees.${index}.piece_id`}
                            control={control}
                            render={({ field }) => (
                              <GlassSelect
                                value={field.value || ""}
                                onChange={field.onChange}
                                options={[
                                  { value: "", label: "Choisir une pièce..." },
                                  ...pieces.map(p => ({ value: p.id, label: `${p.reference} - ${p.designation} (Stock: ${p.stock_actuel})` }))
                                ]}
                              />
                            )}
                          />
                          {errors?.pieces_utilisees?.[index]?.piece_id && (
                            <p className="mt-1 text-[10px] text-red-400">{errors.pieces_utilisees[index]?.piece_id?.message}</p>
                          )}
                        </div>
                        
                        <div className="w-full sm:w-32">
                          <Controller
                            name={`pieces_utilisees.${index}.quantite`}
                            control={control}
                            render={({ field }) => (
                              <GlassNumberInput
                                value={field.value}
                                onChange={field.onChange}
                                min={1}
                              />
                            )}
                          />
                        </div>


                        
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* Confirm Screen */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="rounded-xl border border-[var(--color-turbo)]/20 bg-[var(--color-turbo)]/5 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--color-turbo)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">
                    Confirmation OT : <span className="font-mono text-[var(--color-turbo)]">{formData?.numero}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Cet ordre de travail va être enregistré. S'il contient des pièces utilisées, elles seront déduites du stock automatiquement (si le statut est Terminé).
                  </p>
                </div>
              </div>

              {serverError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Type & Catégorie</p>
                  <p className="text-sm font-semibold text-white">
                    {formData?.type === "PREVENTIVE" ? "Préventive" : "Corrective"} - {formData?.categorie}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Véhicule concerné</p>
                  <p className="text-sm font-semibold text-white truncate font-mono">
                    {selectedVehicle ? `${selectedVehicle.immatriculation} (${selectedVehicle.modele})` : formData?.vehicule_id}
                  </p>
                </div>
                <div className="bg-[var(--color-electric-violet)]/10 rounded-xl p-4 border border-[var(--color-electric-violet)]/20">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-electric-violet)]/70 mb-1">Coût Estimé Total</p>
                  <p className="text-lg font-bold font-mono text-[var(--color-electric-violet)]">
                    {(() => {
                      const estimatedPiecesCost = formData?.pieces_utilisees?.reduce((total, p) => total + ((pieces.find(x => x.id === p.piece_id)?.prix_unitaire_moyen || 0) * (p.quantite || 0)), 0) || 0;
                      const total = Number(formData?.cout_main_doeuvre || 0) + estimatedPiecesCost;
                      return total.toLocaleString("fr-DZ");
                    })()} DZD
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Mécanicien</p>
                  <p className="text-sm font-semibold text-white">
                    {selectedMechanic ? `${selectedMechanic.nom} ${selectedMechanic.prenom}` : "Non assigné"}
                  </p>
                </div>
              </div>

              {/* Summary of pieces */}
              {formData?.pieces_utilisees && formData.pieces_utilisees.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-turbo)] mb-2">
                    {formData.pieces_utilisees.length} pièce(s) liée(s) à déduire :
                  </p>
                  <ul className="space-y-1.5">
                    {formData.pieces_utilisees.map((p, idx) => {
                      const pieceInfo = pieces.find(x => x.id === p.piece_id);
                      return (
                        <li key={idx} className="flex justify-between text-xs text-white/80 border-b border-white/5 pb-1">
                          <span>{pieceInfo?.designation || p.piece_id}</span>
                          <span className="font-mono font-bold text-white">x {p.quantite}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={isConfirming ? () => setIsConfirming(false) : onClose}
            className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            {isConfirming ? "Retour à l'édition" : "Annuler"}
          </button>
          
          {!isConfirming ? (
            <button
              type="button"
              onClick={() => handleSubmit(onSubmit)()}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-[var(--color-electric-violet)] text-white hover:bg-[#6A3DE8] hover:shadow-[0_0_20px_rgba(131,77,251,0.4)] transition-all flex items-center gap-2"
            >
              Continuer <Wrench className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                "Validation..."
              ) : (
                <>Confirmer l'intervention <CheckCircle2 className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
