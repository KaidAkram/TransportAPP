/* ============================================
  E-Transport ERP — Constants & Enums
  ============================================ */

// --- Vehicle Statuses ---
export const STATUT_VEHICULE = {
 DISPONIBLE: "DISPONIBLE",
 MAINTENANCE: "MAINTENANCE",
 IMMOBILISE: "IMMOBILISE",
 HORS_SERVICE: "HORS_SERVICE",
} as const;

export type StatutVehicule = (typeof STATUT_VEHICULE)[keyof typeof STATUT_VEHICULE];

// --- Employee Statuses ---
export const STATUT_EMPLOYE = {
 ACTIF: "ACTIF",
 ABSENT: "ABSENT",
 SUSPENDU: "SUSPENDU",
 QUITTE: "QUITTE",
} as const;

export type StatutEmploye = (typeof STATUT_EMPLOYE)[keyof typeof STATUT_EMPLOYE];

// --- Partner Types ---
export const TYPE_PARTENAIRE = {
 AGENCE_VOYAGE: "AGENCE_VOYAGE",
 ENTREPRISE: "ENTREPRISE",
 HOTEL: "HOTEL",
 ORGANISME: "ORGANISME",
 ASSOCIATION: "ASSOCIATION",
 PARTICULIER: "PARTICULIER",
 AUTRE: "AUTRE",
} as const;

export type TypePartenaire = (typeof TYPE_PARTENAIRE)[keyof typeof TYPE_PARTENAIRE];

// --- Caution Statuses ---
export const STATUT_CAUTION = {
 CREATION: "CREATION",
 CHEZ_CLIENT: "CHEZ_CLIENT",
 RETOURNEE: "RETOURNEE",
 MAIN_LEVEE: "MAIN_LEVEE",
} as const;

export type StatutCaution = (typeof STATUT_CAUTION)[keyof typeof STATUT_CAUTION];

// --- Contract Statuses ---
export const STATUT_CONTRAT = {
 ACTIF: "ACTIF",
 EXPIRE: "EXPIRE",
} as const;

export type StatutContrat = (typeof STATUT_CONTRAT)[keyof typeof STATUT_CONTRAT];

// --- Intervention Categories ---
export const CATEGORIE_INTERVENTION = {
 PREVENTIVE: "PREVENTIVE",
 CORRECTIVE: "CORRECTIVE",
} as const;

export type CategorieIntervention =
 (typeof CATEGORIE_INTERVENTION)[keyof typeof CATEGORIE_INTERVENTION];

// --- Stock Movement Types ---
export const TYPE_MOUVEMENT = {
 ENTREE: "ENTREE",
 SORTIE: "SORTIE",
 INVENTAIRE: "INVENTAIRE",
} as const;

export type TypeMouvement = (typeof TYPE_MOUVEMENT)[keyof typeof TYPE_MOUVEMENT];

// --- Status → Color Token Mapping ---
export const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; label: string }>= {
 // Vehicle
 DISPONIBLE: { bg: "bg-success-bg", text: "text-success-text", label: "Disponible"},
 MAINTENANCE: { bg: "bg-warning-bg", text: "text-warning-text", label: "Maintenance"},
 IMMOBILISE: { bg: "bg-danger-bg", text: "text-danger-text", label: "Immobilisé"},
 HORS_SERVICE: { bg: "bg-neutral-bg", text: "text-neutral-text", label: "Hors service"},
 // Employee
 ACTIF: { bg: "bg-success-bg", text: "text-success-text", label: "Actif"},
 ABSENT: { bg: "bg-warning-bg", text: "text-warning-text", label: "Absent"},
 SUSPENDU: { bg: "bg-danger-bg", text: "text-danger-text", label: "Suspendu"},
 QUITTE: { bg: "bg-neutral-bg", text: "text-neutral-text", label: "Quitté"},
 // Caution
 CREATION: { bg: "bg-warning-bg", text: "text-warning-text", label: "Création"},
 CHEZ_CLIENT: { bg: "bg-danger-bg", text: "text-danger-text", label: "Chez le client"},
 RETOURNEE: { bg: "bg-success-bg", text: "text-success-text", label: "Retournée"},
 MAIN_LEVEE: { bg: "bg-neutral-bg", text: "text-neutral-text", label: "Main levée"},
 // Contract
 ACTIF_CONTRAT: { bg: "bg-success-bg", text: "text-success-text", label: "Actif"},
 EXPIRE: { bg: "bg-neutral-bg", text: "text-neutral-text", label: "Expiré"},
 // Intervention
 PLANIFIEE: { bg: "bg-warning-bg", text: "text-warning-text", label: "Planifiée"},
 EN_COURS: { bg: "bg-accent/10", text: "text-accent", label: "En cours"},
 TERMINEE: { bg: "bg-success-bg", text: "text-success-text", label: "Terminée"},
 ANNULEE: { bg: "bg-danger-bg", text: "text-danger-text", label: "Annulée"},
 // Devis
 BROUILLON: { bg: "bg-neutral-bg", text: "text-neutral-text", label: "Brouillon"},
 ENVOYE: { bg: "bg-warning-bg", text: "text-warning-text", label: "Envoyé"},
 ACCEPTE: { bg: "bg-success-bg", text: "text-success-text", label: "Accepté"},
 REFUSE: { bg: "bg-danger-bg", text: "text-danger-text", label: "Refusé"},
 // Facture
 EN_ATTENTE: { bg: "bg-warning-bg", text: "text-warning-text", label: "En attente"},
 PARTIEL: { bg: "bg-accent/10", text: "text-accent", label: "Payé Partiel"},
 PAYE: { bg: "bg-success-bg", text: "text-success-text", label: "Soldée / Payée"},
 RETARD: { bg: "bg-danger-bg", text: "text-danger-text", label: "En retard"},
};

// --- Navigation Items ---
export const NAV_ITEMS = [
 { label: "Tableau de bord", href: "/", icon: "LayoutDashboard"},
 { label: "Finances & Devis", href: "/finances", icon: "Receipt"},
 { label: "Analyses & BI", href: "/analytics", icon: "BarChart3"},
 { label: "Véhicules", href: "/vehicules", icon: "Bus"},
 { label: "Employés", href: "/employes", icon: "Users"},
 { label: "Partenaires CRM", href: "/partenaires", icon: "Building2"},
 { label: "Contrats", href: "/contrats", icon: "FileText"},
 { label: "Cautions", href: "/cautions", icon: "Shield"},
 { label: "Maintenance", href: "/maintenance", icon: "Wrench"},
 { label: "Stock & Pièces", href: "/stock", icon: "Package"},
] as const;

// --- API Base URL ---
// Use relative path to leverage Next.js rewrite proxy to the backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
