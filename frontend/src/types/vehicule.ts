export type StatutVehicule =
  | "DISPONIBLE"
  | "EN_MISSION"
  | "MAINTENANCE"
  | "IMMOBILISE"
  | "HORS_SERVICE";

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  type: string;
  nombre_places: number;
  annee?: number | null;
  date_mise_circulation?: string | null;
  kilometrage_actuel: number;
  statut: StatutVehicule;
  cout_total: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface DocumentSummary {
  id: string;
  nom: string;
  type: string;
  url_fichier: string;
  date_emission?: string | null;
  date_expiration?: string | null;
  statut_validite?: "Valide" | "Expire bientôt" | "Expiré" | null;
}

export interface ConstatSummary {
  id: string;
  date: string;
  heure?: string | null;
  lieu: string;
  circonstances: string;
  dommages: string;
  tiers_implique: boolean;
  infos_tiers?: string | null;
}

export interface VehiculeDetail extends Vehicule {
  documents: DocumentSummary[];
  constats: ConstatSummary[];
  total_constats: number;
  documents_valides: number;
  documents_expires: number;
  documents_alertes: number;
}

export interface VehiculeListResponse {
  items: Vehicule[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
