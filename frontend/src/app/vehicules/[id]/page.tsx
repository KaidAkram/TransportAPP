"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bus,
  FileText,
  AlertTriangle,
  Calendar,
  Gauge,
  Plus,
  Clock,
  ShieldCheck,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
  Wrench,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddDocumentModal } from "@/components/modules/vehicules/AddDocumentModal";
import { AddConstatModal } from "@/components/modules/vehicules/AddConstatModal";
import { AddInterventionModal } from "@/components/modules/maintenance/AddInterventionModal";
import { api } from "@/lib/api";
import { VehiculeDetail } from "@/types/vehicule";

export default function VehiculeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [vehicule, setVehicule] = useState<VehiculeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "documents" | "constats" | "maintenance">("infos");
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isConstatModalOpen, setIsConstatModalOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<VehiculeDetail>(`/vehicules/${resolvedParams.id}`);
      setVehicule(res.data);
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
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
        <Bus className="h-8 w-8 animate-bounce text-primary-base" />
        <p className="text-xs text-text-secondary">Chargement de la fiche véhicule...</p>
      </div>
    );
  }

  if (!vehicule) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-10 w-10 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Véhicule introuvable</h2>
        <Button asChild variant="outline" className="text-xs border-border">
          <Link href="/vehicules">Retour au parc automobile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs border-border h-9"
          >
            <Link href="/vehicules">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour au parc
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-mono text-text-primary">
                {vehicule.immatriculation}
              </h1>
              <StatusBadge status={vehicule.statut} />
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {vehicule.marque} {vehicule.modele} · {vehicule.type} · {vehicule.nombre_places} places
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDocModalOpen(true)}
            className="text-xs border-border h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Ajouter Document
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInterventionModalOpen(true)}
            className="text-xs border-border h-9 text-primary-base"
          >
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            + Ordre de Travail
          </Button>
          <Button
            size="sm"
            onClick={() => setIsConstatModalOpen(true)}
            className="text-xs bg-danger hover:bg-danger/90 text-white h-9"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Déclarer Constat
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Kilométrage Actuel</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {vehicule.kilometrage_actuel.toLocaleString("fr-FR")} km
              <Gauge className="h-4 w-4 text-text-secondary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Dernier relevé compteur</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Statut Documentaire</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {vehicule.documents_valides} / {vehicule.documents.length}
              <ShieldCheck className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {vehicule.documents_alertes > 0 ? (
              <p className="text-[11px] text-warning font-semibold">
                ⚠️ {vehicule.documents_alertes} document(s) expirent bientôt
              </p>
            ) : vehicule.documents_expires > 0 ? (
              <p className="text-[11px] text-danger font-semibold">
                🚨 {vehicule.documents_expires} document(s) expirés
              </p>
            ) : (
              <p className="text-[11px] text-success">Tous les documents sont valides</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Sinistres & Accidents</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {vehicule.total_constats}
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Constats déclarés enregistrés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Coût Cumulé (TCO)</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {vehicule.cout_total.toLocaleString("fr-FR")} DZD
              <DollarSign className="h-4 w-4 text-text-secondary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Maintenance & réparations</p>
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
          <Bus className="h-4 w-4" />
          1. Fiche Technique
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "documents"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="h-4 w-4" />
          2. Documents Administratifs ({vehicule.documents.length})
        </button>
        <button
          onClick={() => setActiveTab("constats")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "constats"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          3. Constats & Sinistres ({vehicule.constats.length})
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "maintenance"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Wrench className="h-4 w-4" />
          4. Maintenance & Pièces ({vehicule.interventions?.length || 0})
        </button>
      </div>

      {/* TAB 1: INFORMATIONS */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Caractéristiques Générales</CardTitle>
              <CardDescription className="text-xs">Données constructeur et spécifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Immatriculation</span>
                <span className="font-mono font-bold text-text-primary">{vehicule.immatriculation}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Marque</span>
                <span className="font-medium text-text-primary">{vehicule.marque}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Modèle</span>
                <span className="font-medium text-text-primary">{vehicule.modele}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Catégorie / Type</span>
                <span className="font-medium text-text-primary">{vehicule.type}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Capacité assise</span>
                <span className="font-mono text-text-primary">{vehicule.nombre_places} places</span>
              </div>
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Année modèle</span>
                <span className="font-mono text-text-primary">{vehicule.annee || "Non renseignée"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Exploitation & Suivi Opérationnel</CardTitle>
              <CardDescription className="text-xs">Mise en service et état du compteur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Date 1ère mise en circulation</span>
                <span className="font-mono text-text-primary">
                  {vehicule.date_mise_circulation || "Non renseignée"}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Kilométrage actuel</span>
                <span className="font-mono font-bold text-text-primary">
                  {vehicule.kilometrage_actuel.toLocaleString("fr-FR")} km
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Statut opérationnel</span>
                <span>
                  <StatusBadge status={vehicule.statut} />
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Coût total maintenance (TCO)</span>
                <span className="font-mono font-bold text-text-primary">
                  {vehicule.cout_total.toLocaleString("fr-FR")} DZD
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Date d&apos;enregistrement système</span>
                <span className="font-mono text-text-secondary">
                  {new Date(vehicule.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Papiers réglementaires, contrôle technique et assurance avec alertes d&apos;expiration.
            </p>
            <Button
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau Document
            </Button>
          </div>

          {vehicule.documents.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <FileText className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun document rattaché</p>
              <p className="text-xs text-text-secondary mt-1">
                Ajoutez l&apos;assurance, la carte grise ou le contrôle technique pour suivre leur validité.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicule.documents.map((doc) => {
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
                          <Download className="h-3.5 w-3.5" /> Télécharger / Voir Fichier
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

      {/* TAB 3: CONSTATS & SINISTRES */}
      {activeTab === "constats" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Historique des accidents, déclarations d&apos;assurance et dommages matériels enregistrés.
            </p>
            <Button
              size="sm"
              onClick={() => setIsConstatModalOpen(true)}
              className="text-xs bg-danger hover:bg-danger/90 text-white"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Nouvelle Déclaration
            </Button>
          </div>

          {vehicule.constats.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-text-primary">Aucun sinistre déclaré</p>
              <p className="text-xs text-text-secondary mt-1">
                Ce véhicule n&apos;a aucun accident ou dommage matériel consigné dans le registre.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {vehicule.constats.map((c) => (
                <Card key={c.id} className="bg-surface border-border shadow-xs overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border bg-danger-bg/40 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      <CardTitle className="text-xs font-semibold text-danger-text">
                        Sinistre du {new Date(c.date).toLocaleDateString("fr-FR")} {c.heure ? `à ${c.heure}` : ""}
                      </CardTitle>
                    </div>
                    <span className="text-xs font-mono text-text-secondary">{c.lieu}</span>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-text-secondary mb-0.5">Circonstances :</p>
                      <p className="text-text-primary bg-background p-2.5 rounded-md border border-border">
                        {c.circonstances}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-text-secondary mb-0.5">Dommages constatés :</p>
                      <p className="text-text-primary bg-background p-2.5 rounded-md border border-border">
                        {c.dommages}
                      </p>
                    </div>
                    {c.tiers_implique && (
                      <div className="p-2.5 rounded-md bg-warning-bg/40 border border-warning/30">
                        <p className="font-semibold text-warning-text mb-0.5">Tiers impliqué :</p>
                        <p className="text-text-primary">{c.infos_tiers || "Informations non détaillées"}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MAINTENANCE & GMAO */}
      {activeTab === "maintenance" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Historique complet des ordres de travail, réparations et pièces détachées consommées.
            </p>
            <Button
              size="sm"
              onClick={() => setIsInterventionModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouvel Ordre de Travail
            </Button>
          </div>

          {(!vehicule.interventions || vehicule.interventions.length === 0) ? (
            <Card className="bg-surface border-border p-12 text-center">
              <Wrench className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucune intervention enregistrée</p>
              <p className="text-xs text-text-secondary mt-1">
                Les ordres de travail de vidange, freinage ou réparations apparaîtront ici.
              </p>
            </Card>
          ) : (
            <Card className="bg-surface border-border shadow-xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-table-header">
                    <TableRow className="border-b border-border">
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">N° OT</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Catégorie</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Mécanicien</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Date & Kilométrage</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Travaux Réalisés</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Coût</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicule.interventions.map((it) => (
                      <TableRow key={it.id} className="border-b border-border hover:bg-primary-light/10">
                        <TableCell className="font-mono text-xs font-bold text-primary-base">
                          {it.numero}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-text-primary">
                          {it.categorie}
                        </TableCell>
                        <TableCell className="text-xs text-text-secondary">
                          {it.mecanicien_nom || "Atelier"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-text-secondary">
                          <div>{new Date(it.date).toLocaleDateString("fr-FR")}</div>
                          <div className="text-[10px] text-text-secondary font-bold">
                            {it.kilometrage.toLocaleString("fr-DZ")} KM
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-text-primary max-w-[250px] truncate" title={it.travail_effectue || ""}>
                          {it.travail_effectue || "Révision générale"}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-text-primary">
                          {it.cout_total.toLocaleString("fr-DZ")} DZD
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              it.statut === "TERMINEE"
                                ? "bg-success-bg text-success-text"
                                : "bg-warning-bg text-warning-text"
                            }`}
                          >
                            {it.statut === "TERMINEE" ? "Terminée" : it.statut}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal Dialogs */}
      <AddDocumentModal
        vehiculeId={vehicule.id}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddConstatModal
        vehiculeId={vehicule.id}
        isOpen={isConstatModalOpen}
        onClose={() => setIsConstatModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddInterventionModal
        defaultVehiculeId={vehicule.id}
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
    </div>
  );
}
