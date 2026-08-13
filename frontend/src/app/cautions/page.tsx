"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  Search,
  RefreshCw,
  Download,
  FileText,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
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
import { AddCautionModal } from "@/components/modules/cautions/AddCautionModal";
import { api } from "@/lib/api";
import { Caution, CautionListResponse } from "@/types/caution";

export default function CautionsPage() {
  const [cautions, setCautions] = useState<Caution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCautions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.statut = statusFilter;

      const res = await api.get<CautionListResponse>("/cautions", params);
      setCautions(res.data.items);
    } catch (err) {
      console.error("Error fetching cautions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchCautions();
  }, [fetchCautions]);

  const handleGeneratePdf = async (id: string) => {
    try {
      await api.post(`/cautions/${id}/generate-pdf`, {});
      fetchCautions();
    } catch (err) {
      alert("Erreur lors de la génération du document PDF de la caution.");
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (confirm(`Confirmez-vous l'archivage de la caution ${num} ?`)) {
      try {
        await api.delete(`/cautions/${id}`);
        fetchCautions();
      } catch (err) {
        alert("Erreur lors de l'archivage de la caution.");
      }
    }
  };

  // KPI Calculations
  const totalCount = cautions.length;
  const chezClientCount = cautions.filter((c) => c.statut === "CHEZ_CLIENT").length;
  const retourneeCount = cautions.filter((c) => c.statut === "RETOURNEE" || c.statut === "MAIN_LEVEE").length;
  const totalGarantiDZD = cautions.reduce((acc, c) => acc + (c.montant || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Gestion des Cautions Bancaires
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Suivi des engagements financiers (Soumission & Bonne Exécution) et génération d&apos;actes officiels
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCautions}
            className="text-xs border-border h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="text-xs bg-primary-base hover:bg-primary-base/90 text-white h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle Caution
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Total Cautions</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-primary font-mono">{totalCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Actes de garantie émis</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Chez le Client (En cours)</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-warning-bg text-warning-text">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning font-mono">{chezClientCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">En cours de rétention</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Retournées / Mainlevée</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-success-bg text-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success font-mono">{retourneeCount}</div>
            <p className="text-[11px] text-text-secondary mt-0.5">Fonds libérés</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-text-secondary">Encours Cautionné</CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary-light text-primary-base">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-primary-base font-mono truncate">
              {totalGarantiDZD.toLocaleString("fr-DZ")} DZD
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Garanties bancaires globales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="bg-surface border-border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par n° caution, client, contrat..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les types de caution</option>
                <option value="BONNE_EXECUTION">🛡️ Bonne Exécution</option>
                <option value="SOUMISSION">📑 Soumission (Appel d&apos;Offres)</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary-base focus:outline-none focus:ring-1 focus:ring-primary-base"
              >
                <option value="">Tous les statuts</option>
                <option value="CHEZ_CLIENT">🟠 Chez le Client</option>
                <option value="CREATION">🟡 En Création</option>
                <option value="RETOURNEE">🟢 Retournée</option>
                <option value="MAIN_LEVEE">⚪ Mainlevée Accordée</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cautions Table */}
      <Card className="bg-surface border-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">N° Caution</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Client Bénéficiaire</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Type & Objet</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Montant Garanti</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Réf. Contrat / AO</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Émission / Échéance</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Attestation PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-text-secondary">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-base" />
                    Chargement des cautions bancaires...
                  </TableCell>
                </TableRow>
              ) : cautions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <ShieldCheck className="h-8 w-8 text-neutral mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-text-primary">Aucune caution enregistrée</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Ajustez vos filtres ou émettez une nouvelle caution de soumission ou bonne exécution.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                cautions.map((c) => {
                  const isBonneExec = c.type === "BONNE_EXECUTION";

                  return (
                    <TableRow
                      key={c.id}
                      className="border-b border-border hover:bg-primary-light/20 transition-colors"
                    >
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary-base block">
                          {c.numero}
                        </span>
                        <span className="text-[10px] text-text-secondary">{c.banque_emetteur}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-text-primary">
                          {c.client_nom || "Client"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold mb-1 ${
                            isBonneExec
                              ? "bg-primary-light text-primary-base"
                              : "bg-warning-bg text-warning-text"
                          }`}
                        >
                          {isBonneExec ? "🛡️ Bonne Exécution" : "📑 Soumission"}
                        </span>
                        <p className="text-xs text-text-secondary truncate max-w-[180px]" title={c.objet}>
                          {c.objet}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-text-primary">
                          {c.montant.toLocaleString("fr-DZ")} {c.devise}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-secondary">
                        {c.contrat_reference || c.reference_numero || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-mono">
                        <div>{new Date(c.date_emission).toLocaleDateString("fr-FR")}</div>
                        {c.date_echeance && (
                          <div className="text-[10px] text-text-secondary">
                            Échéance: {new Date(c.date_echeance).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            c.statut === "CHEZ_CLIENT"
                              ? "bg-warning-bg text-warning-text"
                              : c.statut === "RETOURNEE" || c.statut === "MAIN_LEVEE"
                              ? "bg-success-bg text-success-text"
                              : "bg-neutral text-text-secondary"
                          }`}
                        >
                          {c.statut === "CHEZ_CLIENT"
                            ? "Chez le Client"
                            : c.statut === "RETOURNEE"
                            ? "Retournée"
                            : c.statut === "MAIN_LEVEE"
                            ? "Mainlevée"
                            : "Création"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {c.url_caution_pdf ? (
                          <a
                            href={c.url_caution_pdf}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-primary-base font-semibold hover:bg-primary-light/30 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF Acte
                          </a>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGeneratePdf(c.id)}
                            className="text-xs border-border h-7 text-primary-base"
                          >
                            <FileText className="h-3 w-3 mr-1" /> Générer
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id, c.numero)}
                          className="text-xs text-danger hover:bg-danger-bg h-7 px-2"
                          title="Archiver la caution"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Caution Modal */}
      <AddCautionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCautions()}
      />
    </div>
  );
}
