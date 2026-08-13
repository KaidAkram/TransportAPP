"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  FileEdit,
  ShieldCheck,
  Download,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Factory,
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
import { AddAvenantModal } from "@/components/modules/contrats/AddAvenantModal";
import { AddCautionModal } from "@/components/modules/cautions/AddCautionModal";
import { AddContractDocumentModal } from "@/components/modules/contrats/AddContractDocumentModal";
import { api } from "@/lib/api";
import { ContratDetail } from "@/types/contrat";

export default function ContratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contrat, setContrat] = useState<ContratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "avenants" | "cautions" | "documents">("infos");
  const [isAvenantModalOpen, setIsAvenantModalOpen] = useState(false);
  const [isCautionModalOpen, setIsCautionModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ContratDetail>(`/contrats/${resolvedParams.id}`);
      setContrat(res.data);
    } catch (err) {
      console.error("Error fetching contract details:", err);
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
        <FileText className="h-8 w-8 animate-bounce text-primary-base" />
        <p className="text-xs text-text-secondary">Chargement du dossier contractuel...</p>
      </div>
    );
  }

  if (!contrat) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-10 w-10 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Contrat introuvable</h2>
        <Button asChild variant="outline" className="text-xs border-border">
          <Link href="/contrats">Retour au registre des contrats</Link>
        </Button>
      </div>
    );
  }

  const isClient = contrat.partenaire_role === "CLIENT";
  const isUrgent = contrat.jours_restants !== null && contrat.jours_restants !== undefined && contrat.jours_restants >= 0 && contrat.jours_restants <= 7;
  const isWarning = contrat.jours_restants !== null && contrat.jours_restants !== undefined && contrat.jours_restants > 7 && contrat.jours_restants <= 30;
  const isExpired = contrat.jours_restants !== null && contrat.jours_restants !== undefined && contrat.jours_restants < 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs border-border h-9"
          >
            <Link href="/contrats">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour aux contrats
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-mono text-text-primary">
                {contrat.reference}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                  isClient
                    ? "bg-primary-light text-primary-base"
                    : "bg-warning-bg text-warning-text"
                }`}
              >
                {isClient ? <Users className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                {contrat.partenaire_nom}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  contrat.statut === "ACTIF"
                    ? "bg-success-bg text-success-text"
                    : "bg-danger-bg text-danger-text"
                }`}
              >
                {contrat.statut}
              </span>
              {isExpired ? (
                <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-bold text-danger-text">
                  🔴 Expiré
                </span>
              ) : isUrgent ? (
                <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-bold text-danger-text animate-pulse">
                  🔴 {contrat.alerte_expiration}
                </span>
              ) : isWarning ? (
                <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-bold text-warning-text">
                  🟠 {contrat.alerte_expiration}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {contrat.objet}
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
            <FileText className="h-3.5 w-3.5 mr-1.5 text-primary-base" />
            + Document
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCautionModalOpen(true)}
            className="text-xs border-border h-9"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-warning" />
            + Caution
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAvenantModalOpen(true)}
            className="text-xs bg-primary-base hover:bg-primary-base/90 text-white h-9"
          >
            <FileEdit className="h-3.5 w-3.5 mr-1.5" />
            + Nouvel Avenant
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Montant Révisé Total</CardDescription>
            <CardTitle className="text-lg font-bold font-mono text-primary-base truncate mt-1">
              {contrat.montant_total_avec_avenants.toLocaleString("fr-DZ")} {contrat.devise}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">
              Initial : {contrat.montant.toLocaleString("fr-DZ")} {contrat.devise}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Avenants Enregistrés</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {contrat.total_avenants}
              <FileEdit className="h-4 w-4 text-primary-base" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Modifications contractuelles</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Cautions Rattachées</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {contrat.total_cautions}
              <ShieldCheck className="h-4 w-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Garanties financières liées</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Documents & Pièces</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {contrat.total_documents}
              <FileText className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Scans & avenants signés</p>
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
          <FileText className="h-4 w-4" />
          1. Fiche Contractuelle
        </button>
        <button
          onClick={() => setActiveTab("avenants")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "avenants"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileEdit className="h-4 w-4" />
          2. Avenants ({contrat.avenants.length})
        </button>
        <button
          onClick={() => setActiveTab("cautions")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "cautions"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          3. Cautions Bancaires ({contrat.cautions.length})
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
          4. Pièces Jointes ({contrat.documents.length})
        </button>
      </div>

      {/* TAB 1: INFORMATIONS */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Conditions Contractuelles</CardTitle>
              <CardDescription className="text-xs">Paramètres financiers et modalités de facturation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Référence</span>
                <span className="font-mono font-bold text-primary-base">{contrat.reference}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Partenaire Contractant</span>
                <span className="font-bold text-text-primary">{contrat.partenaire_nom}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Type de Marché</span>
                <span className="font-semibold text-text-primary">{contrat.type_contrat}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Montant Initial HT</span>
                <span className="font-mono font-bold text-text-primary">
                  {contrat.montant.toLocaleString("fr-DZ")} {contrat.devise}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Mode de Règlement</span>
                <span className="text-text-primary">{contrat.mode_facturation || "Mensuel"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Conditions de Paiement</span>
                <span className="text-text-primary">{contrat.conditions_paiement || "Virement 30j"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Calendrier & Validité</CardTitle>
              <CardDescription className="text-xs">Dates d&apos;effet et statut de renouvellement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Date d&apos;Effet (Début)</span>
                <span className="font-mono text-text-primary">
                  {new Date(contrat.date_debut).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Date d&apos;Échéance (Fin)</span>
                <span className="font-mono font-bold text-text-primary">
                  {new Date(contrat.date_fin).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Jours Restants</span>
                <span className="font-mono font-bold text-text-primary">
                  {contrat.jours_restants} jour(s)
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Alerte Renouvellement</span>
                <span>{contrat.alerte_expiration}</span>
              </div>
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Statut de la Convention</span>
                <span className="font-bold text-success">{contrat.statut}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: AVENANTS */}
      {activeTab === "avenants" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Historique des avenants modifiant les montants financiers ou les dates de fin.
            </p>
            <Button
              size="sm"
              onClick={() => setIsAvenantModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouvel Avenant
            </Button>
          </div>

          {contrat.avenants.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <FileEdit className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun avenant enregistré</p>
              <p className="text-xs text-text-secondary mt-1">
                Les avenants permettent de prolonger la durée du contrat ou d&apos;ajuster le montant financier.
              </p>
            </Card>
          ) : (
            <Card className="bg-surface border-border shadow-xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-table-header">
                    <TableRow className="border-b border-border">
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Numéro</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Date Signature</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Objet de l&apos;Avenant</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Variation Montant</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Nouvelle Échéance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrat.avenants.map((av) => (
                      <TableRow key={av.id} className="border-b border-border hover:bg-primary-light/10">
                        <TableCell className="font-mono text-xs font-bold text-primary-base">
                          {av.numero}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-text-secondary">
                          {new Date(av.date).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-semibold text-text-primary">{av.objet}</p>
                          {av.description && (
                            <p className="text-[11px] text-text-secondary mt-0.5">{av.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-text-primary">
                          {av.modif_montant
                            ? `${av.modif_montant > 0 ? "+" : ""}${av.modif_montant.toLocaleString("fr-DZ")} DZD`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-text-secondary">
                          {av.nouvelle_date_fin
                            ? new Date(av.nouvelle_date_fin).toLocaleDateString("fr-FR")
                            : "Inchangée"}
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

      {/* TAB 3: CAUTIONS BANCAIRES */}
      {activeTab === "cautions" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Cautions bancaires émises en couverture de ce marché (Bonne exécution ou Soumission).
            </p>
            <Button
              size="sm"
              onClick={() => setIsCautionModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Émettre une Caution
            </Button>
          </div>

          {contrat.cautions.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <ShieldCheck className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucune caution bancaire rattachée</p>
              <p className="text-xs text-text-secondary mt-1">
                Émettez une caution de bonne exécution et générez l&apos;acte officiel PDF instantanément.
              </p>
            </Card>
          ) : (
            <Card className="bg-surface border-border shadow-xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-table-header">
                    <TableRow className="border-b border-border">
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">N° Caution</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Montant Garanti</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Date Émission</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Document</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrat.cautions.map((cau) => (
                      <TableRow key={cau.id} className="border-b border-border hover:bg-primary-light/10">
                        <TableCell className="font-mono text-xs font-bold text-primary-base">
                          {cau.numero}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-text-primary">
                          {cau.type === "BONNE_EXECUTION" ? "🛡️ Bonne Exécution" : "📑 Soumission"}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-text-primary">
                          {cau.montant.toLocaleString("fr-DZ")} {cau.devise}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-text-secondary">
                          {new Date(cau.date_emission).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              cau.statut === "CHEZ_CLIENT"
                                ? "bg-warning-bg text-warning-text"
                                : "bg-success-bg text-success-text"
                            }`}
                          >
                            {cau.statut === "CHEZ_CLIENT" ? "Chez le Client" : cau.statut}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {cau.url_caution_pdf ? (
                            <a
                              href={cau.url_caution_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-primary-base font-semibold hover:bg-primary-light/30 transition-colors"
                            >
                              <Download className="h-3 w-3" /> PDF
                            </a>
                          ) : (
                            <span className="text-xs text-text-secondary">—</span>
                          )}
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

      {/* TAB 4: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Contrat signé, bons de commande, bordereaux et annexes techniques.
            </p>
            <Button
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau Document
            </Button>
          </div>

          {contrat.documents.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <FileText className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun document rattaché</p>
              <p className="text-xs text-text-secondary mt-1">
                Joignez la version numérisée du contrat paraphé ou les ordres de service.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contrat.documents.map((doc) => (
                <Card key={doc.id} className="bg-surface border-border shadow-xs overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border bg-table-header flex flex-row items-center justify-between">
                    <div className="overflow-hidden">
                      <CardTitle className="text-xs font-semibold truncate">{doc.nom}</CardTitle>
                      <CardDescription className="text-[11px]">{doc.type}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-text-secondary">Émission :</span>
                      <span className="font-mono text-text-primary">{doc.date_emission || "—"}</span>
                    </div>
                    <div className="pt-2">
                      <a
                        href={doc.url_fichier}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full rounded-md border border-border bg-background py-1.5 text-xs text-primary-base font-semibold hover:bg-primary-light/30 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Consulter le Fichier
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddAvenantModal
        contratId={contrat.id}
        isOpen={isAvenantModalOpen}
        onClose={() => setIsAvenantModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddCautionModal
        isOpen={isCautionModalOpen}
        onClose={() => setIsCautionModalOpen(false)}
        onSuccess={() => fetchDetail()}
        defaultContratId={contrat.id}
        defaultClientId={contrat.partenaire_id}
      />
      <AddContractDocumentModal
        contratId={contrat.id}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
    </div>
  );
}
