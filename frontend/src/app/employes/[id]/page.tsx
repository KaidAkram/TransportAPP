"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Shield,
  Wrench,
  FileText,
  Calendar,
  Phone,
  MapPin,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ManageLicenseModal } from "@/components/modules/employes/ManageLicenseModal";
import { AddEmployeeDocumentModal } from "@/components/modules/employes/AddEmployeeDocumentModal";
import { GlassDocumentManager } from "@/components/shared/GlassDocumentManager";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { EmployeDetail } from "@/types/employe";

export default function EmployeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [employe, setEmploye] = useState<EmployeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "permis" | "interventions" | "documents">("infos");
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<EmployeDetail>(`/employes/${resolvedParams.id}`);
      setEmploye(res.data);
    } catch (err) {
      console.error("Error fetching employee details:", err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <User className="h-8 w-8 animate-pulse text-[var(--color-electric-violet)]" />
        <p className="text-xs text-white/50 font-accent uppercase tracking-widest">Chargement du dossier...</p>
      </div>
    );
  }

  if (!employe) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Collaborateur introuvable</h2>
        <Link 
          href="/employes"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          Retour au registre du personnel
        </Link>
      </div>
    );
  }

  const isChauffeur = employe.type_employe === "CHAUFFEUR";
  const isMecanicien = employe.type_employe === "MECANICIEN";
  const avatarSrc =
    employe.photo ||
    (isChauffeur
      ? "/assets/avatars/driver_pro.jpg"
      : "/assets/avatars/mechanic_pro.jpg");

  const tabClass = (isActive: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
      isActive
        ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/50 shadow-[0_0_15px_rgba(131,77,251,0.2)]"
        : "text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent"
    }`;

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div className="flex items-center gap-6">
          <Link 
            href="/employes"
            className="w-fit inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au registre
          </Link>

          <div className="flex items-center gap-5">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[var(--color-electric-violet)] bg-black/20 shadow-[0_0_20px_rgba(131,77,251,0.3)] shrink-0">
              <Image
                src={avatarSrc}
                alt={`${employe.nom} ${employe.prenom}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
                  {employe.nom} {employe.prenom}
                </h1>
                <span className="font-mono text-[10px] font-bold text-white/80 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  {employe.matricule}
                </span>
                <StatusBadge status={employe.statut} />
              </div>
              <p className="text-sm text-[var(--color-electric-violet)] flex items-center gap-2.5 font-medium">
                <span>
                  {isChauffeur ? "Chauffeur Grand Tourisme" : isMecanicien ? "Mécanicien d'Atelier" : "Administratif"}
                </span>
                {employe.telephone && <span className="text-white/50">· <Phone className="inline-block h-3 w-3 mr-1" />{employe.telephone}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Triggers - Chauffeur only */}
        {isChauffeur && (
          <div className="flex items-center">
            <button
              onClick={() => setIsLicenseModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              <Shield className="h-3.5 w-3.5 mr-1.5 text-[var(--color-electric-violet)]" />
              {employe.permis ? "Gérer le Permis" : "+ Ajouter Permis"}
            </button>
          </div>
        )}
      </div>
      {/* Top KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-[var(--color-electric-violet)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-electric-violet)]/10 transition-all duration-500 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-white/50 font-accent uppercase tracking-widest">Statut RH & Contrat</p>
              <User className="h-4 w-4 text-white/30" />
            </div>
            <StatusBadge status={employe.statut} />
          </div>
          <p className="text-[11px] text-white/40 mt-4 font-mono">
            Recruté le {employe.date_embauche ? new Date(employe.date_embauche).toLocaleDateString("fr-FR") : "—"}
          </p>
        </div>

        {isChauffeur ? (
          <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-[var(--color-electric-violet)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-electric-violet)]/10 transition-all duration-500 pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-white/50 font-accent uppercase tracking-widest">Permis de Conduire</p>
                <Shield className="h-4 w-4 text-[var(--color-electric-violet)]" />
              </div>
              <span className="text-xl font-bold font-mono text-white tracking-wide">
                {employe.permis?.numero || "Non renseigné"}
              </span>
            </div>
            <div className="mt-4">
              {employe.permis ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    employe.permis.statut_validite === "Expiré"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : employe.permis.statut_validite === "Expire bientôt"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {employe.permis.statut_validite || "Valide"} ({employe.permis.categories})
                </span>
              ) : (
                <p className="text-[11px] text-red-400 font-semibold">Aucun permis attaché</p>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-[var(--color-turbo)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-turbo)]/10 transition-all duration-500 pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-white/50 font-accent uppercase tracking-widest">Interventions</p>
                <Wrench className="h-4 w-4 text-[var(--color-turbo)]" />
              </div>
              <span className="text-3xl font-bold font-mono text-white tracking-tight">
                {employe.total_interventions}
              </span>
            </div>
            <p className="text-[11px] text-white/40 mt-4 font-mono">Ordres de réparation</p>
          </div>
        )}

        <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-[var(--color-electric-violet)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-electric-violet)]/10 transition-all duration-500 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-white/50 font-accent uppercase tracking-widest">Documents RH</p>
              <FileText className="h-4 w-4 text-[var(--color-electric-violet)]" />
            </div>
            <span className="text-3xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1">
              {employe.documents_valides} <span className="text-white/30 text-lg font-medium">/ {employe.documents.length}</span>
            </span>
          </div>
          <div className="mt-4">
            {employe.documents_alertes > 0 ? (
              <p className="text-[11px] text-amber-400 font-semibold">
                {employe.documents_alertes} doc(s) à renouveler
              </p>
            ) : employe.documents_expires > 0 ? (
              <p className="text-[11px] text-red-400 font-semibold">
                {employe.documents_expires} doc(s) expirés
              </p>
            ) : (
              <p className="text-[11px] text-emerald-400">Dossier RH conforme</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-[var(--color-electric-violet)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-electric-violet)]/10 transition-all duration-500 pointer-events-none"></div>
          <div>
            <p className="text-[10px] text-white/50 font-accent uppercase tracking-widest mb-3">Spécialité & Qualification</p>
            <span className="text-sm font-bold font-heading text-white truncate pr-2 leading-tight">
              {isChauffeur
                ? employe.fonction || "Chauffeur Transport"
                : employe.specialite || "Maintenance Générale"}
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-4 font-mono">
            {isChauffeur
              ? employe.assurance ? "Assurance Pro Active" : "Sans Assurance"
              : employe.type_mecanicien || "Technicien"}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl w-fit border border-white/5 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.2s' }}>
        <button onClick={() => setActiveTab("infos")} className={tabClass(activeTab === "infos")}>
          <User className="h-4 w-4" /> 1. Informations & Contrat
        </button>

        {isChauffeur && (
          <button onClick={() => setActiveTab("permis")} className={tabClass(activeTab === "permis")}>
            <Shield className="h-4 w-4" /> 2. Permis de Conduire
          </button>
        )}

        {isMecanicien && (
          <button onClick={() => setActiveTab("interventions")} className={tabClass(activeTab === "interventions")}>
            <Wrench className="h-4 w-4" /> 2. Interventions Atelier ({employe.interventions.length})
          </button>
        )}

        <button onClick={() => setActiveTab("documents")} className={tabClass(activeTab === "documents")}>
          <FileText className="h-4 w-4" /> 3. Documents RH ({employe.documents.length})
        </button>
      </div>

      {/* TAB 1: INFORMATIONS */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div className="glass-panel overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-bold font-heading text-white">État Civil & Coordonnées</h3>
              <p className="text-xs text-white/40 mt-1.5">Informations personnelles de l&apos;employé</p>
            </div>
            <div className="p-0">
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Matricule RH</span>
                  <span className="font-mono font-bold text-white text-right">{employe.matricule}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Nom & Prénom</span>
                  <span className="font-medium text-white text-right">{employe.nom} {employe.prenom}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Date de naissance</span>
                  <span className="font-mono text-white/90 text-right">
                    {employe.date_naissance ? new Date(employe.date_naissance).toLocaleDateString("fr-FR") : "Non renseignée"}
                  </span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Numéro de téléphone</span>
                  <span className="font-mono font-medium text-white/90 text-right">{employe.telephone || "—"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Adresse de résidence</span>
                  <span className="text-white/90 text-right">{employe.adresse || "Non renseignée"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-bold font-heading text-white">Profil Professionnel & Affectation</h3>
              <p className="text-xs text-white/40 mt-1.5">Rôle opérationnel et contrat d&apos;embauche</p>
            </div>
            <div className="p-0">
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Corps de métier</span>
                  <span className="text-[10px] font-bold font-accent uppercase tracking-wider text-white bg-[var(--color-electric-violet)] px-2 py-0.5 rounded-md w-fit justify-self-end text-right">{employe.type_employe}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Poste / Fonction</span>
                  <span className="font-medium text-white justify-self-end text-right">{employe.fonction || "—"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Date d&apos;embauche</span>
                  <span className="font-mono text-white/90 justify-self-end text-right">
                    {employe.date_embauche ? new Date(employe.date_embauche).toLocaleDateString("fr-FR") : "—"}
                  </span>
                </div>
                {isChauffeur && (
                  <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                    <span className="text-white/40 font-medium">Assurance Professionnelle</span>
                    <span className={`justify-self-end text-right ${employe.assurance ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}`}>
                      {employe.assurance ? "Active & Couverte" : "Non couverte"}
                    </span>
                  </div>
                )}
                {isMecanicien && (
                  <>
                    <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                      <span className="text-white/40 font-medium">Spécialité Technique</span>
                      <span className="font-medium text-white justify-self-end text-right">{employe.specialite || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                      <span className="text-white/40 font-medium">Expérience / Responsabilité</span>
                      <span className="font-medium text-[var(--color-electric-violet)] justify-self-end text-right">
                        {employe.experience || "—"} {employe.est_responsable ? "· Chef d'Atelier" : ""}
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] items-center hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Statut RH</span>
                  <span className="justify-self-end text-right"><StatusBadge status={employe.statut} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 (CHAUFFEUR): PERMIS DE CONDUIRE */}
      {isChauffeur && activeTab === "permis" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Gestion du titre de conduite, catégories validées et suivi d&apos;expiration.
            </p>
            <button
              onClick={() => setIsLicenseModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all"
            >
              <Shield className="h-3.5 w-3.5 mr-2 text-[var(--color-electric-violet)]" />
              {employe.permis ? "Modifier le Permis" : "Enregistrer un Permis"}
            </button>
          </div>

          {!employe.permis ? (
            <div className="glass-panel p-16 text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white">Aucun permis de conduire enregistré</p>
              <p className="text-xs text-white/40 mt-2 max-w-md">
                Enregistrez le numéro de permis et la date d&apos;expiration pour activer le suivi automatique de conformité.
              </p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden w-full max-w-3xl">
              <div className="p-6 border-b border-white/10 bg-black/10 flex flex-row items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-mono text-white tracking-widest">
                    {employe.permis.numero}
                  </h3>
                  <p className="text-xs text-white/50 mt-1">Permis de Conduire Biométrique</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-bold border ${
                    employe.permis.statut_validite === "Expiré"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : employe.permis.statut_validite === "Expire bientôt"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {employe.permis.statut_validite || "Valide"}
                </span>
              </div>
              <div className="p-0">
                <div className="divide-y divide-white/5 text-[13px]">
                  <div className="grid grid-cols-2 px-8 py-5 hover:bg-white/5 transition-colors">
                    <span className="text-white/50">Catégories autorisées :</span>
                    <div className="flex gap-2">
                      {employe.permis.categories.split(",").map((cat, i) => (
                         <span key={i} className="rounded-md bg-[var(--color-electric-violet)]/20 border border-[var(--color-electric-violet)]/50 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-sm">
                           {cat.trim()}
                         </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 px-8 py-5 hover:bg-white/5 transition-colors">
                    <span className="text-white/50">Date d&apos;obtention :</span>
                    <span className="font-mono text-white">
                      {employe.permis.date_obtention || "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 px-8 py-5 hover:bg-white/5 transition-colors">
                    <span className="text-white/50">Date d&apos;expiration :</span>
                    <span className="font-mono font-bold text-white">
                      {employe.permis.date_expiration || "Sans expiration"}
                    </span>
                  </div>
                </div>
                {employe.permis.scan_permis && (
                  <div className="p-4 border-t border-white/10 bg-black/5">
                    <a
                      href={employe.permis.scan_permis}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-white hover:bg-white/10 transition-all font-semibold"
                    >
                      <Download className="h-4 w-4 text-[var(--color-electric-violet)]" /> Consulter le Scan du Permis
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2 (MECANICIEN): INTERVENTIONS ATELIER */}
      {isMecanicien && activeTab === "interventions" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <p className="text-xs text-white/50">
            Ordres de réparation, diagnostics et travaux de maintenance supervisés ou réalisés par ce technicien.
          </p>

          {employe.interventions.length === 0 ? (
            <div className="glass-panel p-16 text-center flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/50" />
              </div>
              <p className="text-sm font-semibold text-white">Aucune intervention enregistrée</p>
              <p className="text-xs text-white/40 mt-2 max-w-md">
                Les interventions atelier affectées à ce mécanicien apparaîtront automatiquement ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employe.interventions.map((inter) => (
                <div key={inter.id} className="glass-panel overflow-hidden">
                  <div className="p-4 pb-3 border-b border-white/10 bg-black/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-4 w-4 text-[var(--color-turbo)]" />
                      <h3 className="text-xs font-bold font-mono text-white">
                        {inter.numero} · {inter.categorie}
                      </h3>
                      {inter.est_responsable && (
                        <span className="rounded bg-[var(--color-electric-violet)] px-2 py-0.5 text-[10px] font-bold text-white">
                          Chef d&apos;Équipe
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded">
                      {new Date(inter.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    {inter.vehicule_immatriculation && (
                      <div className="flex justify-between pb-2 border-b border-white/5">
                        <span className="text-white/50">Véhicule traité :</span>
                        <span className="font-mono font-bold text-[var(--color-electric-violet)]">
                          {inter.vehicule_immatriculation}
                        </span>
                      </div>
                    )}
                    {inter.probleme_constate && (
                      <div>
                        <p className="font-semibold text-white/40 mb-1.5 uppercase tracking-wider text-[10px]">Diagnostic / Problème :</p>
                        <p className="text-white/80 bg-black/20 p-2.5 rounded-lg border border-white/5">
                          {inter.probleme_constate}
                        </p>
                      </div>
                    )}
                    {inter.travail_effectue && (
                      <div>
                        <p className="font-semibold text-white/40 mb-1.5 uppercase tracking-wider text-[10px]">Travaux réalisés :</p>
                        <p className="text-white/80 bg-black/20 p-2.5 rounded-lg border border-white/5">
                          {inter.travail_effectue}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENTS ADMINISTRATIFS */}
      {activeTab === "documents" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <p className="text-xs text-white/50 max-w-2xl leading-relaxed">
              Dossier RH du collaborateur (CNI, Extrait de naissance, Contrat de travail, Carte Chifa).
            </p>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="inline-flex items-center shrink-0 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--color-electric-violet)] text-white hover:bg-[var(--color-electric-violet)]/90 shadow-[0_0_15px_rgba(131,77,251,0.3)] transition-all"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Nouveau Document RH
            </button>
          </div>

          {employe.documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employe.documents.map((doc) => {
                const isExpired = doc.statut_validite === "Expiré";
                const isWarning = doc.statut_validite === "Expire bientôt";

                return (
                  <div key={doc.id} className="glass-panel overflow-hidden">
                    <div className="p-4 pb-3 border-b border-white/10 bg-black/10 flex flex-row items-center justify-between">
                      <div className="overflow-hidden pr-3">
                        <h3 className="text-xs font-bold font-heading text-white truncate">{doc.nom}</h3>
                        <p className="text-[10px] text-white/40 font-accent uppercase tracking-wider mt-0.5">{doc.type}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                          isExpired
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : isWarning
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {doc.statut_validite || "Valide"}
                      </span>
                    </div>
                    <div className="p-5 space-y-3 text-[13px]">
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-white/50">Émission :</span>
                        <span className="font-mono text-white/90">{doc.date_emission || "—"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-white/50">Expiration :</span>
                        <span
                          className={`font-mono font-bold ${
                            isExpired ? "text-red-400" : isWarning ? "text-amber-400" : "text-white"
                          }`}
                        >
                          {doc.date_expiration || "Sans expiration"}
                        </span>
                      </div>
                      <div className="pt-4">
                        <a
                          href={`${API_BASE_URL}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--color-electric-violet)] py-3 text-[11px] text-white font-bold hover:bg-[#9d6cfc] transition-all uppercase tracking-wider"
                        >
                          <Download className="h-3.5 w-3.5" /> Consulter le Document
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="pt-4 border-t border-white/5">
            <GlassDocumentManager
              entityType="employe"
              entityId={employe.id}
              title="Dépôt rapide de Fichiers & Documents"
              subtitle="Gérez directement les fichiers scannés (Pièce d'identité, Certificat, Contrat, etc.) sans passer par le formulaire détaillé."
            />
          </div>
        </div>
      )}

      <ManageLicenseModal
        chauffeurId={employe.id}
        existingPermis={employe.permis}
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddEmployeeDocumentModal
        employeId={employe.id}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
    </div>
  );
}
