"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Bus,
  Users,
  Building2,
  Wrench,
  Shield,
  FileText,
  Package,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const testVehicles = [
    { immat: "16-123456-00", marque: "Mercedes-Benz", modele: "Tourismo", type: "Bus", statut: "DISPONIBLE", km: "245 820 km" },
    { immat: "16-987654-00", marque: "Iveco", modele: "Crossway", type: "Bus", statut: "EN_MISSION", km: "189 400 km" },
    { immat: "31-456789-00", marque: "Hyundai", modele: "Universe", type: "Bus", statut: "MAINTENANCE", km: "312 000 km" },
    { immat: "16-112233-00", marque: "Renault", modele: "Master", type: "Minibus", statut: "IMMOBILISE", km: "94 150 km" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            E-Transport ERP — Architecture Foundation (Phase 1)
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Vérification du système de design, des tokens de couleur (#1E40AF), des composants atomiques et du layout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs border-border">
            Documentation
          </Button>
          <Button className="text-xs bg-primary-base hover:bg-primary-base/90 text-white">
            <Activity className="h-4 w-4 mr-2" /> Statut Système : Opérationnel
          </Button>
        </div>
      </div>

      {/* Design System Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Identité Visuelle</CardDescription>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Couleur Primaire
              <div className="h-4 w-4 rounded bg-primary-base" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-primary-light text-primary-base px-2 py-0.5 rounded font-bold">
                #1E40AF
              </span>
              <span className="text-xs text-text-secondary">Primary Base</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Gestion d&apos;État</CardDescription>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Zustand Store
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-secondary">Auth & Alert Stores initialisés avec typage strict TypeScript.</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Composants UI</CardDescription>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Shadcn + Radix
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-secondary">Button, Badge, Card, Table stylisés selon la grille de 8px.</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Typographie</CardDescription>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Police Inter
              <span className="text-xs font-mono">Aa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-secondary">Chiffres tabulaires optimisés pour données denses ERP.</p>
          </CardContent>
        </Card>
      </div>

      {/* Semantic Badges Preview */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Palette Sémantique (Badges de Statut)</CardTitle>
          <CardDescription className="text-xs">
            Indicateurs visuels normalisés à travers les 7 modules de l&apos;application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="DISPONIBLE" />
            <StatusBadge status="ACTIF" />
            <StatusBadge status="EN_MISSION" />
            <StatusBadge status="MAINTENANCE" />
            <StatusBadge status="IMMOBILISE" />
            <StatusBadge status="HORS_SERVICE" />
            <StatusBadge status="CHEZ_CLIENT" />
            <StatusBadge status="RETOURNEE" />
            <StatusBadge status="MAIN_LEVEE" />
          </div>
        </CardContent>
      </Card>

      {/* Test Data Table */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Démonstration Composant DataTable</CardTitle>
            <CardDescription className="text-xs">
              En-tête #F9FAFB, séparateurs 1px #E5E7EB, fond blanc et actions contextuelles.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-table-header">
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Immatriculation</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Marque / Modèle</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Type</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Kilométrage</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase">Statut</TableHead>
                <TableHead className="text-xs font-semibold text-text-secondary uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testVehicles.map((v) => (
                <TableRow key={v.immat} className="border-b border-border hover:bg-primary-light/30 transition-colors">
                  <TableCell className="text-xs font-mono font-medium text-text-primary">{v.immat}</TableCell>
                  <TableCell className="text-xs text-text-primary">{v.marque} {v.modele}</TableCell>
                  <TableCell className="text-xs text-text-secondary">{v.type}</TableCell>
                  <TableCell className="text-xs font-mono text-text-secondary">{v.km}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.statut} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-xs text-primary-base hover:bg-primary-light/50 h-7 px-2">
                      Voir fiche
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 7 Modules Matrix */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Les 7 Modules Métier de l&apos;ERP</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: "1. Véhicules", desc: "Parc automobile & documents", icon: Bus },
            { name: "2. Chauffeurs", desc: "Dossiers & permis de conduire", icon: Users },
            { name: "3. Clients / CRM", desc: "Agences, contacts & conventions", icon: Building2 },
            { name: "4. Maintenance", desc: "Interventions & mécaniciens", icon: Wrench },
            { name: "5. Cautions", desc: "Garanties & génération PDF", icon: Shield },
            { name: "6. Contrats", desc: "Suivi des contrats & avenants", icon: FileText },
            { name: "7. Stock & Pièces", desc: "Pièces détachées & traçabilité", icon: Package },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.name} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary-light text-primary-base">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-text-primary truncate">{m.name}</p>
                  <p className="text-[11px] text-text-secondary truncate">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
