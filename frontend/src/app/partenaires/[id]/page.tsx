"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Building2,
  Users,
  Factory,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Globe,
  Briefcase,
  Star,
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
import { AddContactModal } from "@/components/modules/partenaires/AddContactModal";
import { AddCRMNoteModal } from "@/components/modules/partenaires/AddCRMNoteModal";
import { AddPartnerDocumentModal } from "@/components/modules/partenaires/AddPartnerDocumentModal";
import { api } from "@/lib/api";
import { PartenaireDetail } from "@/types/partenaire";

export default function PartenaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [partner, setPartner] = useState<PartenaireDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "contacts" | "documents" | "crm">("infos");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<PartenaireDetail>(`/partenaires/${resolvedParams.id}`);
      setPartner(res.data);
    } catch (err) {
      console.error("Error fetching partner details:", err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDeleteContact = async (contactId: string, name: string) => {
    if (confirm(`Supprimer l'interlocuteur ${name} de ce compte ?`)) {
      try {
        await api.delete(`/partenaires/${resolvedParams.id}/contacts/${contactId}`);
        fetchDetail();
      } catch (err) {
        alert("Erreur lors de la suppression du contact.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Building2 className="h-8 w-8 animate-bounce text-primary-base" />
        <p className="text-xs text-text-secondary">Chargement du dossier partenaire...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="h-10 w-10 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Partenaire introuvable</h2>
        <Button asChild variant="outline" className="text-xs border-border">
          <Link href="/partenaires">Retour au portefeuille CRM</Link>
        </Button>
      </div>
    );
  }

  const isClient = partner.role_partenaire === "CLIENT";
  const logoSrc =
    partner.logo ||
    (isClient
      ? "/assets/logos/client_default.jpg"
      : "/assets/logos/supplier_default.jpg");

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
            <Link href="/partenaires">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour aux partenaires
            </Link>
          </Button>

          <div className="flex items-center gap-3.5">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-xs shrink-0">
              <Image
                src={logoSrc}
                alt={partner.nom_commercial}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-text-primary">
                  {partner.nom_commercial}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    isClient
                      ? "bg-primary-light text-primary-base"
                      : "bg-warning-bg text-warning-text"
                  }`}
                >
                  {isClient ? <Users className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                  {isClient ? "Client B2B" : "Fournisseur"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    partner.statut_crm === "Actif"
                      ? "bg-success-bg text-success-text"
                      : partner.statut_crm === "Prospect"
                      ? "bg-warning-bg text-warning-text"
                      : partner.statut_crm === "Bloqué"
                      ? "bg-danger-bg text-danger-text"
                      : "bg-neutral text-text-secondary"
                  }`}
                >
                  {partner.statut_crm || "Actif"}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-2">
                <span>📍 {partner.wilaya || "Algérie"}</span>
                {partner.telephone_principal && <span>· 📞 {partner.telephone_principal}</span>}
                {partner.email && <span>· ✉️ {partner.email}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNoteModalOpen(true)}
            className="text-xs border-border h-9"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-primary-base" />
            + Note CRM
          </Button>
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
            onClick={() => setIsContactModalOpen(true)}
            className="text-xs bg-primary-base hover:bg-primary-base/90 text-white h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Ajouter Contact
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Interlocuteur Principal</CardDescription>
            <CardTitle className="text-sm font-bold text-text-primary truncate mt-1">
              {partner.contact_principal
                ? `${partner.contact_principal.nom} ${partner.contact_principal.prenom}`
                : "Non défini"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary font-mono">
              {partner.contact_principal?.telephone || partner.telephone_principal || "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Contacts Répertoire</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {partner.total_contacts}
              <Users className="h-4 w-4 text-primary-base" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Interlocuteurs enregistrés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Échanges & Notes CRM</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {partner.total_notes}
              <MessageSquare className="h-4 w-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">Appels & négociations</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Documents Juridiques</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-text-primary flex items-center justify-between">
              {partner.total_documents}
              <FileText className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-[11px] text-text-secondary">RC, NIF & attestations</p>
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
          <Building2 className="h-4 w-4" />
          1. Informations Société
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "contacts"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Users className="h-4 w-4" />
          2. Contacts ({partner.contacts.length})
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
          3. Documents Juridiques ({partner.documents.length})
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "crm"
              ? "border-primary-base text-primary-base"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          4. Historique CRM & Notes ({partner.crm_notes.length})
        </button>
      </div>

      {/* TAB 1: INFORMATIONS */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Identité Fiscale & Juridique</CardTitle>
              <CardDescription className="text-xs">Données réglementaires de l&apos;entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Raison Sociale</span>
                <span className="font-bold text-text-primary">{partner.nom_commercial}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">NIF (Fiscal)</span>
                <span className="font-mono font-bold text-primary-base">{partner.nif || "Non renseigné"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Registre de Commerce (RC)</span>
                <span className="font-mono text-text-primary">{partner.registre_commerce || "Non renseigné"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">NIS (Statistique)</span>
                <span className="font-mono text-text-primary">{partner.nis || "Non renseigné"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Article d&apos;Imposition</span>
                <span className="font-mono text-text-primary">{partner.article_imposition || "Non renseigné"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Localisation & Coordonnées</CardTitle>
              <CardDescription className="text-xs">Siège et canaux de communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Wilaya & Commune</span>
                <span className="font-medium text-text-primary">
                  {partner.wilaya} {partner.commune ? `(${partner.commune})` : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Adresse Siège</span>
                <span className="text-text-primary">{partner.adresse || "Non renseignée"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Téléphone Standard</span>
                <span className="font-mono font-bold text-text-primary">{partner.telephone_principal || "—"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-border text-xs">
                <span className="text-text-secondary">Email Général</span>
                <span className="text-text-primary">{partner.email || "—"}</span>
              </div>
              <div className="grid grid-cols-2 py-2 text-xs">
                <span className="text-text-secondary">Site Web</span>
                <span>
                  {partner.site_web ? (
                    <a
                      href={partner.site_web}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-base hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3.5 w-3.5" /> {partner.site_web}
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: CONTACTS */}
      {activeTab === "contacts" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Interlocuteurs de l&apos;entreprise (Direction, Logistique, Comptabilité, Achats).
            </p>
            <Button
              size="sm"
              onClick={() => setIsContactModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau Contact
            </Button>
          </div>

          {partner.contacts.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <Users className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun contact enregistré</p>
              <p className="text-xs text-text-secondary mt-1">
                Ajoutez les coordonnées des interlocuteurs clés pour faciliter le suivi opérationnel.
              </p>
            </Card>
          ) : (
            <Card className="bg-surface border-border shadow-xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-table-header">
                    <TableRow className="border-b border-border">
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Nom & Prénom</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Fonction</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Téléphone</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase">Rôle</TableHead>
                      <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.contacts.map((c) => (
                      <TableRow key={c.id} className="border-b border-border hover:bg-primary-light/10">
                        <TableCell className="text-xs font-bold text-text-primary">
                          {c.nom} {c.prenom}
                        </TableCell>
                        <TableCell className="text-xs text-text-secondary">{c.fonction || "—"}</TableCell>
                        <TableCell className="text-xs font-mono text-text-primary">{c.telephone || "—"}</TableCell>
                        <TableCell className="text-xs text-text-secondary">{c.email || "—"}</TableCell>
                        <TableCell>
                          {c.est_principal ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-[10px] font-bold text-primary-base">
                              <Star className="h-3 w-3 fill-primary-base" /> Principal
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-secondary">Secondaire</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(c.id, `${c.nom} ${c.prenom}`)}
                            className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                            title="Supprimer le contact"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* TAB 3: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Pièces administratives, extrait de registre de commerce et attestations fiscales.
            </p>
            <Button
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau Document
            </Button>
          </div>

          {partner.documents.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <FileText className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun document juridique rattaché</p>
              <p className="text-xs text-text-secondary mt-1">
                Joignez le Registre de Commerce (RC), l&apos;attestation NIF ou les statuts d&apos;entreprise.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partner.documents.map((doc) => (
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

      {/* TAB 4: CRM NOTES & TIMELINE */}
      {activeTab === "crm" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              Historique chronologique des interactions, appels, comptes-rendus et relances commerciales.
            </p>
            <Button
              size="sm"
              onClick={() => setIsNoteModalOpen(true)}
              className="text-xs bg-primary-base hover:bg-primary-base/90 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nouvelle Interaction
            </Button>
          </div>

          {partner.crm_notes.length === 0 ? (
            <Card className="bg-surface border-border p-12 text-center">
              <MessageSquare className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Aucun échange consigné</p>
              <p className="text-xs text-text-secondary mt-1">
                Consignez les appels téléphoniques, réunions de travail ou comptes-rendus de négociation.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {partner.crm_notes.map((note) => (
                <Card key={note.id} className="bg-surface border-border shadow-xs overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border bg-table-header flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary-light px-2 py-0.5 text-xs font-bold text-primary-base">
                        {note.type}
                      </span>
                      <CardTitle className="text-xs font-medium text-text-secondary">
                        Par {note.auteur}
                      </CardTitle>
                    </div>
                    <span className="text-xs font-mono text-text-secondary">
                      {new Date(note.date).toLocaleDateString("fr-FR")}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4 text-xs text-text-primary bg-background/50">
                    <p className="leading-relaxed whitespace-pre-wrap">{note.contenu}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddContactModal
        partenaireId={partner.id}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddCRMNoteModal
        partenaireId={partner.id}
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
      <AddPartnerDocumentModal
        partenaireId={partner.id}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
    </div>
  );
}
