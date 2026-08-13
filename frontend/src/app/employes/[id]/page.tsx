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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ManageLicenseModal } from "@/components/modules/employes/ManageLicenseModal";
import { AddEmployeeDocumentModal } from "@/components/modules/employes/AddEmployeeDocumentModal";
import { api } from "@/lib/api";
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
        <User className="h-8 w-8 animate-bounce text-primary-base" />
        <p className="text-xs text-text-secondary">Chargement du dossier collaborateur...</p>
      </div>
    );
  }

  if (!employe) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-10 w-10 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Collaborateur introuvable</h2>
        <Button asChild variant="outline" className="text-xs border-border">
          <Link href="/employes">Retour au registre du personnel</Link>
        </Button>
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs border-border h-9"
          >
            <Link href="/employes">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour au personnel
            </Link>
          </Button>

          <div className="flex items-center gap-3.5">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary-base bg-surface shadow-xs shrink-0">
              <Image
                src={avatarSrc}
                alt={`${employe.nom} ${employe.prenom}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-text-primary">
                  {employe.nom} {employe.prenom}
                </h1>
                <span className="font-mono text-xs font-bold text-text-secondary bg-surface px-2 py-0.5 rounded border border-border">
                  {employe.matricule}
                </span>
                <StatusBadge status={employe.statut} />
              </div>
              <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-2">
                <span className="font-semibold text-primary-base">
                  {isChauffeur ? "Chauffeur Grand Tourisme" : isMecanicien ? "Mécanicien d'Atelier" : "Administratif"}
                </span>
                {employe.telephone && <span>· 📞 {employe.telephone}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2.5">
          {isChauffeur && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLicenseModalOpen(true)}
              className="text-xs border-border h-9"
            >
              <Shield className="h-3.5 w-3.5 mr-1.5 text-primary-base" />
              {employe.permis ? "Gérer le Permis" : "+ Ajouter Permis"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsDocModalOpen(true)}
            className="text-xs bg-primary-base hover:bg-primary-base/90 text-white h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Ajouter Document RH
          </Button>
        </div>
      </div>

      {/* Top KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Statut RH & Contrat</CardDescription>
            <CardTitle className="text-base font-bold text-text-primary flex items-center justify-between mt-1">
              <StatusBadge status={employe.statut} />
              <User className="h-4 w-4 text-text-secondary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">
              Recruté le {employe.date_embauche ? new Date(employe.date_embauche).toLocaleDateString("fr-FR") : "—"}
            </p>
          </CardContent>
        </Card>

        {isChauffeur ? (
          <Card className="bg-surface border-border shadow-xs">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs">Validité Permis de Conduire</CardDescription>
              <CardTitle className="text-base font-bold font-mono text-text-primary flex items-center justify-between mt-1">
                {employe.permis?.numero || "Non renseigné"}
                <Shield className="h-4 w-4 text-primary-base" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              {employe.permis ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    employe.permis.statut_validite === "Expiré"
                      ? "bg-danger-bg text-danger-text"
                      : employe.permis.statut_validite === "Expire bientôt"
                      ? "bg-warning-bg text-warning-text"
                      : "bg-success-bg text-success-text"
                  }`}
                >
                  {employe.permis.statut_validite || "Valide"} ({employe.permis.categories})
                </span>
              ) : (
                <p className="text-[11px] text-danger font-semibold">Aucun permis attaché</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-surface border-border shadow-xs">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs">Interventions Atelier</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
                {employe.total_interventions}
                <Wrench className="h-4 w-4 text-warning" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-[11px] text-text-secondary">Ordres de réparation réalisés</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Documents RH Rattachés</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {employe.documents_valides} / {employe.documents.length}
              <FileText className="h-4 w-4 text-primary-base" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {employe.documents_alertes > 0 ? (
              <p className="text-[11px] text-warning font-semibold">
                ⚠️ {employe.documents_alertes} doc(s) à renouveler
              </p>
            ) : employe.documents_expires > 0 ? (
              <p className="text-[11px] text-danger font-semibold">
                🚨 {employe.documents_expires} doc(s) expirés
              </p>
            ) : (
              <p className="text-[11px] text-success">Dossier RH conforme</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Spécialité & Qualification</CardDescription>
            <CardTitle className="text-sm font-bold text-text-primary truncate mt-1">
              {isChauffeur
                ? employe.fonction || "Chauffeur Transport"
                : employe.specialite || "Maintenance Générale"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">
              {isChauffeur
                ? employe.assurance ? "✅ Assurance Pro Active" : "❌ Sans Assurance"
                : employe.type_mecanicien || "Technicien"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border bg-surface rounded-t-lg px-4 pt-2 gap-2">
        <button
          onClick={() => setActiveTab("infos")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "infos"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <User className="h-4 w-4" />
          1. Informations & Contrat
        </button>

        {isChauffeur && (
          <button
            onClick={() => setActiveTab("permis")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "permis"
                ? "border-primary-base text-primary-base"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Shield className="h-4 w-4" />
            2. Permis de Conduire
          </button>
        )}

        {isMecanicien && (
          <button
            onClick={() => setActiveTab("interventions")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "interventions"
                ? "border-primary-base text-primary-base"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Wrench className="h-4 w-4" />
            2. Interventions Atelier ({employe.interventions.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "documents"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="h-4 w-4" />
          3. Documents RH ({employe.documents.length})
        </button>
      </div>

      {/* TAB 1: INFORMATIONS */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">État Civil & Coordonnées</CardTitle>
              <CardDescription className="text-xs">Informations personnelles de l&apos;employé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Matricule RH</span>
                <span className="font-mono font-bold text-text-primary">{employe.matricule}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Nom & Prénom</span>
                <span className="font-medium text-text-primary">{employe.nom} {employe.prenom}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Date de naissance</span>
                <span className="font-mono text-text-primary">
                  {employe.date_naissance ? new Date(employe.date_naissance).toLocaleDateString("fr-FR") : "Non renseignée"}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Numéro de téléphone</span>
                <span className="font-mono font-medium text-text-primary">{employe.telephone || "—"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Adresse de résidence</span>
                <span className="text-text-primary">{employe.adresse || "Non renseignée"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Profil Professionnel & Affectation</CardTitle>
              <CardDescription className="text-xs">Rôle opérationnel et contrat d&apos;embauche</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Corps de métier</span>
                <span className="font-semibold text-primary-base">{employe.type_employe}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Poste / Fonction</span>
                <span className="font-medium text-text-primary">{employe.fonction || "—"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Date d&apos;embauche</span>
                <span className="font-mono text-text-primary">
                  {employe.date_embauche ? new Date(employe.date_embauche).toLocaleDateString("fr-FR") : "—"}
                </span>
              </div>
              {isChauffeur && (
                <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                  <span className="text-text-secondary">Assurance Professionnelle</span>
                  <span className={employe.assurance ? "text-success font-semibold" : "text-danger font-semibold"}>
                    {employe.assurance ? "Active & Couverte" : "Non couverte"}
                  </span>
                </div>
              )}
              {isMecanicien && (
                <>
                  <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                    <span className="text-text-secondary">Spécialité Technique</span>
                    <span className="font-medium text-text-primary">{employe.specialite || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                    <span className="text-text-secondary">Expérience / Responsabilité</span>
                    <span className="font-medium text-text-primary">
                      {employe.experience || "—"} {employe.est_responsable ? "· Chef d'Atelier" : ""}
                    </span>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Statut RH</span>
                <span><StatusBadge status={employe.statut} /></span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2 (CHAUFFEUR): PERMIS DE CONDUIRE */}
      {isChauffeur && activeTab === "permis" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Gestion du titre de conduite, catégories validées et suivi d&apos;expiration.
            </p>
            <Button
              size="sm"
              onClick={() => setIsLicenseModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              {employe.permis ? "Modifier les informations du Permis" : "Enregistrer un Permis"}
            </Button>
          </div>

          {!employe.permis ? (
            <Card className="bg-surface border-border p-12 text-center">
              <Shield className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun permis de conduire enregistré</p>
              <p className="text-xs text-text-secondary mt-1">
                Enregistrez le numéro de permis et la date d&apos;expiration pour le suivi de conformité.
              </p>
            </Card>
          ) : (
            <Card className="bg-surface border-border shadow-xs max-w-2xl overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-border bg-table-header flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold font-mono text-text-primary">
                    {employe.permis.numero}
                  </CardTitle>
                  <CardDescription className="text-xs">Permis de Conduire Biométrique</CardDescription>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    employe.permis.statut_validite === "Expiré"
                      ? "bg-danger-bg text-danger-text"
                      : employe.permis.statut_validite === "Expire bientôt"
                      ? "bg-warning-bg text-warning-text"
                      : "bg-success-bg text-success-text"
                  }`}
                >
                  {employe.permis.statut_validite || "Valide"}
                </span>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 py-1.5 border-b border-border">
                  <span className="text-text-secondary">Catégories autorisées :</span>
                  <div className="flex gap-1.5">
                    {employe.permis.categories.split(",").map((cat, i) => (
                      <span
                        key={i}
                        className="rounded bg-primary-light px-2 py-0.5 font-mono text-[11px] font-bold text-primary-base"
                      >
                        {cat.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-border">
                  <span className="text-text-secondary">Date d&apos;obtention :</span>
                  <span className="font-mono text-text-primary">
                    {employe.permis.date_obtention || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-border">
                  <span className="text-text-secondary">Date d&apos;expiration :</span>
                  <span className="font-mono font-bold text-text-primary">
                    {employe.permis.date_expiration || "Sans expiration"}
                  </span>
                </div>
                {employe.permis.scan_permis && (
                  <div className="pt-2">
                    <a
                      href={employe.permis.scan_permis}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full rounded-md border border-border bg-background py-2 text-xs text-primary-base font-semibold hover:bg-primary-light/30 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Télécharger / Consulter le Scan du Permis
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2 (MECANICIEN): INTERVENTIONS ATELIER */}
      {isMecanicien && activeTab === "interventions" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <p className="text-xs text-text-secondary">
            Ordres de réparation, diagnostics et travaux de maintenance supervisés ou réalisés par ce technicien.
          </p>

          {employe.interventions.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-text-primary">Aucune intervention enregistrée</p>
              <p className="text-xs text-text-secondary mt-1">
                Les interventions atelier affectées à ce mécanicien apparaîtront automatiquement ici.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {employe.interventions.map((inter) => (
                <Card key={inter.id} className="bg-surface border-border shadow-xs overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border bg-table-header flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Wrench className="h-4 w-4 text-warning" />
                      <CardTitle className="text-xs font-bold font-mono text-text-primary">
                        {inter.numero} · {inter.categorie}
                      </CardTitle>
                      {inter.est_responsable && (
                        <span className="rounded bg-primary-light px-1.5 py-0.5 text-[10px] font-bold text-primary-base">
                          Chef d&apos;Équipe
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-text-secondary">
                      {new Date(inter.date).toLocaleDateString("fr-FR")}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-xs">
                    {inter.vehicule_immatriculation && (
                      <div className="flex justify-between py-1 border-b border-border">
                        <span className="text-text-secondary">Véhicule traité :</span>
                        <span className="font-mono font-bold text-primary-base">
                          {inter.vehicule_immatriculation}
                        </span>
                      </div>
                    )}
                    {inter.probleme_constate && (
                      <div>
                        <p className="font-semibold text-text-secondary mb-0.5">Diagnostic / Problème :</p>
                        <p className="text-text-primary bg-background p-2 rounded border border-border">
                          {inter.probleme_constate}
                        </p>
                      </div>
                    )}
                    {inter.travail_effectue && (
                      <div>
                        <p className="font-semibold text-text-secondary mb-0.5">Travaux réalisés :</p>
                        <p className="text-text-primary bg-background p-2 rounded border border-border">
                          {inter.travail_effectue}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENTS ADMINISTRATIFS */}
      {activeTab === "documents" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Dossier RH du collaborateur (CNI, Extrait de naissance, Contrat de travail, Carte Chifa).
            </p>
            <Button
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau Document RH
            </Button>
          </div>

          {employe.documents.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <FileText className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun document RH rattaché</p>
              <p className="text-xs text-text-secondary mt-1">
                Ajoutez la CNI, l&apos;extrait de naissance ou le certificat médical pour compléter le dossier.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employe.documents.map((doc) => {
                const isExpired = doc.statut_validite === "Expiré";
                const isWarning = doc.statut_validite === "Expire bientôt";

                return (
                  <Card key={doc.id} className="bg-surface border-border shadow-xs overflow-hidden">
                    <CardHeader className="p-4 pb-2 border-b border-border bg-table-header flex flex-row items-center justify-between">
                      <div className="overflow-hidden">
                        <CardTitle className="text-xs font-semibold truncate">{doc.nom}</CardTitle>
                        <CardDescription className="text-[11px]">{doc.type}</CardDescription>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isExpired
                            ? "bg-danger-bg text-danger-text"
                            : isWarning
                            ? "bg-warning-bg text-warning-text"
                            : "bg-success-bg text-success-text"
                        }`}
                      >
                        {doc.statut_validite || "Valide"}
                      </span>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-border">
                        <span className="text-text-secondary">Émission :</span>
                        <span className="font-mono text-text-primary">{doc.date_emission || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border">
                        <span className="text-text-secondary">Expiration :</span>
                        <span
                          className={`font-mono font-bold ${
                            isExpired ? "text-danger" : isWarning ? "text-warning" : "text-text-primary"
                          }`}
                        >
                          {doc.date_expiration || "Sans expiration"}
                        </span>
                      </div>
                      <div className="pt-2">
                        <a
                          href={doc.url_fichier}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full rounded-md border border-border bg-background py-1.5 text-xs text-primary-base font-semibold hover:bg-primary-light/30 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Consulter le Document
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
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
