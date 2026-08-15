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
  AlertTriangle,
  Globe,
  Star,
} from "lucide-react";
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
import { GlassDocumentManager } from "@/components/shared/GlassDocumentManager";
import { GlassConfirmModal } from "@/components/ui/GlassConfirmModal";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { PartenaireDetail } from "@/types/partenaire";
import { Portal } from "@/components/shared/Portal";

export default function PartenaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [partner, setPartner] = useState<PartenaireDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"infos" | "contacts" | "documents" | "crm">("infos");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "danger" | "success" | "warning" | "info";
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

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

  const handleDeleteContact = (contactId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmer la suppression",
      message: `Êtes-vous sûr de vouloir supprimer l'interlocuteur ${name} de ce compte ? Cette action est irréversible.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/partenaires/${resolvedParams.id}/contacts/${contactId}`);
          fetchDetail();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setConfirmModal({
            isOpen: true,
            title: "Erreur",
            message: "Erreur lors de la suppression du contact.",
            type: "danger",
            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Building2 className="h-10 w-10 animate-bounce text-[var(--color-electric-violet)]" />
        <p className="text-sm font-accent uppercase tracking-widest text-white/50 font-bold">Chargement du dossier partenaire...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-20 space-y-6">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Partenaire introuvable</h2>
        <Link
          href="/partenaires"
          className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-bold text-white border border-white/10 transition-all"
        >
          Retour au portefeuille CRM
        </Link>
      </div>
    );
  }

  const isClient = partner.role_partenaire === "CLIENT";

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0s' }}>
        <div className="flex flex-col gap-4">
          <Link
            href="/partenaires"
            className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'annuaire
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-white tracking-tight drop-shadow-md">
                {partner.nom_commercial}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isClient
                    ? "bg-[var(--color-electric-violet)] text-white"
                    : "bg-[var(--color-turbo)] text-black"
                }`}
              >
                {isClient ? <Users className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                {isClient ? "Client B2B" : "Fournisseur"}
              </span>
              <span className="scale-90 origin-left"><StatusBadge status={partner.statut_crm || "Actif"} /></span>
            </div>
            <p className="text-[11px] text-white/50 font-mono flex items-center gap-3">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-white/30" /> {partner.wilaya || "Algérie"}</span>
              {partner.telephone_principal && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-white/30" /> {partner.telephone_principal}</span>}
              {partner.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-white/30" /> {partner.email}</span>}
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
          >
            <MessageSquare className="h-4 w-4 mr-2 text-white/50" />
            Note CRM
          </button>
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2 text-white/50" />
            Document
          </button>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white border border-white/20 transition-all shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Contact
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-accent uppercase tracking-widest text-white/50">Interlocuteur Principal</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white border border-white/10">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-base font-bold text-white truncate">
              {partner.contact_principal
                ? `${partner.contact_principal.nom} ${partner.contact_principal.prenom}`
                : "Non défini"}
            </div>
            <p className="text-[11px] text-white/40 mt-1 font-mono tracking-wider">
              {partner.contact_principal?.telephone || partner.telephone_principal || "—"}
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-accent uppercase tracking-widest text-white/50">Contacts Répertoire</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-electric-violet)]/10 text-[var(--color-electric-violet)] border border-[var(--color-electric-violet)]/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-[var(--color-electric-violet)] font-mono">{partner.total_contacts}</div>
            <p className="text-[11px] text-white/40 mt-1 font-mono uppercase tracking-wider">Interlocuteurs enregistrés</p>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-accent uppercase tracking-widest text-white/50">Échanges & Notes CRM</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-amber-400 font-mono">{partner.total_notes}</div>
            <p className="text-[11px] text-white/40 mt-1 font-mono uppercase tracking-wider">Appels & négociations</p>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-accent uppercase tracking-widest text-white/50">Documents Juridiques</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-emerald-400 font-mono">{partner.total_documents}</div>
            <p className="text-[11px] text-white/40 mt-1 font-mono uppercase tracking-wider">RC, NIF & attestations</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1.5 bg-white/5 rounded-xl w-fit border border-white/5 opacity-0 animate-[stagger-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards] min-w-0 max-w-full" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => setActiveTab("infos")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === "infos"
              ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_15px_rgba(131,77,251,0.15)]"
              : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Building2 className="h-4 w-4" />
          1. Informations Société
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === "contacts"
              ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_15px_rgba(131,77,251,0.15)]"
              : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Users className="h-4 w-4" />
          2. Contacts ({partner.contacts.length})
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === "documents"
              ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_15px_rgba(131,77,251,0.15)]"
              : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <FileText className="h-4 w-4" />
          3. Documents ({partner.documents.length})
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${
            activeTab === "crm"
              ? "bg-[var(--color-electric-violet)]/20 text-white border border-[var(--color-electric-violet)]/30 shadow-[0_0_15px_rgba(131,77,251,0.15)]"
              : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          4. Historique CRM ({partner.crm_notes.length})
        </button>
      </div>

      {/* TAB 1: INFORMATIONS */}
      {activeTab === "infos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          <div className="glass-panel overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-bold font-heading text-white">Identité Fiscale & Juridique</h3>
              <p className="text-xs text-white/40 mt-1.5">Données réglementaires de l&apos;entreprise</p>
            </div>
            <div className="p-0">
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Raison Sociale</span>
                  <span className="font-bold text-white text-right">{partner.nom_commercial}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">NIF (Fiscal)</span>
                  <span className="font-mono font-bold text-[var(--color-electric-violet)] text-right">{partner.nif || "Non renseigné"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Registre de Commerce (RC)</span>
                  <span className="font-mono text-white text-right">{partner.registre_commerce || "Non renseigné"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">NIS (Statistique)</span>
                  <span className="font-mono text-white text-right">{partner.nis || "Non renseigné"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Article d&apos;Imposition</span>
                  <span className="font-mono text-white text-right">{partner.article_imposition || "Non renseigné"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-bold font-heading text-white">Localisation & Coordonnées</h3>
              <p className="text-xs text-white/40 mt-1.5">Siège et canaux de communication</p>
            </div>
            <div className="p-0">
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Wilaya & Commune</span>
                  <span className="font-medium text-white text-right">
                    {partner.wilaya} {partner.commune ? `(${partner.commune})` : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Adresse Siège</span>
                  <span className="text-white text-right">{partner.adresse || "Non renseignée"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Téléphone Standard</span>
                  <span className="font-mono font-bold text-white text-right">{partner.telephone_principal || "—"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Email Général</span>
                  <span className="text-white text-right">{partner.email || "—"}</span>
                </div>
                <div className="grid grid-cols-2 px-8 py-5 text-[13px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/40 font-medium">Site Web</span>
                  <span className="text-right justify-self-end">
                    {partner.site_web ? (
                      <a
                        href={partner.site_web}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-electric-violet)] hover:underline flex items-center gap-1.5 font-medium"
                      >
                        <Globe className="h-3.5 w-3.5" /> {partner.site_web}
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS */}
      {activeTab === "contacts" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between glass-panel px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[var(--color-electric-violet)]">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-[13px] text-white/60 max-w-lg leading-relaxed">
                Interlocuteurs de l&apos;entreprise (Direction, Logistique, Comptabilité, Achats).
              </p>
            </div>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-electric-violet)] hover:bg-[var(--color-electric-violet)]/80 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(131,77,251,0.3)] border border-white/10 transition-all shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Nouveau Contact
            </button>
          </div>

          {partner.contacts.length === 0 ? (
            <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/20 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-white">Aucun contact enregistré</p>
              <p className="text-xs text-white/40 mt-1.5 max-w-md">
                Ajoutez les coordonnées des interlocuteurs clés pour faciliter le suivi opérationnel.
              </p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="min-w-0 custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/5">
                      <TableHead>Nom & Prénom</TableHead>
                      <TableHead>Fonction</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.contacts.map((c) => (
                      <TableRow key={c.id} className="border-none hover:bg-white/[0.02] transition-colors">
                        <TableCell className="font-bold text-white">
                          {c.nom} {c.prenom}
                        </TableCell>
                        <TableCell className="text-white/70">{c.fonction || "—"}</TableCell>
                        <TableCell className="font-mono text-white/90">{c.telephone || "—"}</TableCell>
                        <TableCell className="text-white/70">{c.email || "—"}</TableCell>
                        <TableCell>
                          {c.est_principal ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-turbo)]/10 border border-[var(--color-turbo)]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-turbo)]">
                              <Star className="h-3 w-3 fill-[var(--color-turbo)]" /> Principal
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                              Secondaire
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => handleDeleteContact(c.id, `${c.nom} ${c.prenom}`)}
                            className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer le contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between glass-panel px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-[13px] text-white/60 max-w-lg leading-relaxed">
                Pièces administratives, extrait de registre de commerce et attestations fiscales.
              </p>
            </div>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-400 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Nouveau Document
            </button>
          </div>

          {partner.documents.length === 0 ? (
            <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/20 mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-white">Aucun document juridique rattaché</p>
              <p className="text-xs text-white/40 mt-1.5 max-w-md">
                Joignez le Registre de Commerce (RC), l&apos;attestation NIF ou les statuts d&apos;entreprise.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partner.documents.map((doc) => (
                <div key={doc.id} className="glass-panel overflow-hidden flex flex-col hover:bg-white/[0.04] transition-colors">
                  <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-[13px] font-bold text-white truncate">{doc.nom}</h4>
                        <p className="text-[11px] font-accent uppercase tracking-wider text-white/40 mt-0.5">{doc.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40">Émission</span>
                      <span className="font-mono font-bold text-white">{doc.date_emission || "—"}</span>
                    </div>
                    <div className="mt-auto pt-2">
                      <a
                        href={`${API_BASE_URL}/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-[var(--color-electric-violet)] font-bold hover:bg-white/10 transition-colors w-full"
                      >
                        <Download className="h-4 w-4" /> Consulter le Fichier
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CRM NOTES & TIMELINE */}
      {activeTab === "crm" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between glass-panel px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-amber-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="text-[13px] text-white/60 max-w-lg leading-relaxed">
                Historique chronologique des interactions, appels, comptes-rendus et relances commerciales.
              </p>
            </div>
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 text-xs font-bold text-amber-400 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Nouvelle Interaction
            </button>
          </div>

          {partner.crm_notes.length === 0 ? (
            <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/20 mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-white">Aucun échange consigné</p>
              <p className="text-xs text-white/40 mt-1.5 max-w-md">
                Consignez les appels téléphoniques, réunions de travail ou comptes-rendus de négociation.
              </p>
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-white/10 ml-2">
              {partner.crm_notes.map((note) => (
                <div key={note.id} className="relative pl-12 group">
                  {/* Timeline node */}
                  <div className="absolute left-[15px] top-4 h-[9px] w-[9px] rounded-full bg-[var(--color-electric-violet)] ring-4 ring-background z-10 group-hover:scale-125 transition-transform" />
                  
                  <div className="glass-panel overflow-hidden hover:bg-white/[0.03] transition-colors group-hover:border-white/20">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-white/10 border border-white/10 px-2 py-1 text-[10px] font-accent uppercase tracking-wider text-white">
                          {note.type}
                        </span>
                        <div className="text-[13px] font-bold text-white">
                          {note.auteur}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-white/40 bg-black/20 px-2.5 py-1 rounded-full border border-white/5">
                        {new Date(note.date).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-5 text-[13px] text-white/70 leading-relaxed">
                      <p className="whitespace-pre-wrap">{note.contenu}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Portal>
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

      {/* Global File Upload */}
      <div className="mt-8 animate-in fade-in duration-300">
        <GlassDocumentManager
          entityType="partenaire"
          entityId={partner.id}
          title="Fichiers & Documents Joints"
          subtitle="Gérez les copies scannées (Registre de commerce, RIB, Contrats, etc.)"
        />
      </div>
      {/* Confirm Modal */}
      <GlassConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
      </Portal>
    </div>
  );
}
