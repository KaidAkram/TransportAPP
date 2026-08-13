export type CategorieIntervention = "PREVENTIVE" | "CORRECTIVE";
export type StatutIntervention = "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

export interface PieceConsommeeItem {
  piece_id: string;
  quantite: number;
  reference?: string | null;
  designation?: string | null;
  unite?: string | null;
}

export interface MecanicienParticipantItem {
  mecanicien_id: string;
  nom?: string | null;
  prenom?: string | null;
  specialite?: string | null;
}

export interface InterventionDocument {
  id: string;
  nom: string;
  type: string;
  url_fichier: string;
  date_emission?: string | null;
  date_expiration?: string | null;
}

export interface Intervention {
  id: string;
  numero: string;
  vehicule_id: string;
  vehicule_immatriculation?: string | null;
  vehicule_marque?: string | null;
  vehicule_modele?: string | null;
  mecanicien_responsable_id?: string | null;
  mecanicien_nom_complet?: string | null;
  type: CategorieIntervention;
  categorie: string;
  date: string;
  kilometrage: number;
  probleme_constate?: string | null;
  diagnostic?: string | null;
  travail_effectue?: string | null;
  est_externe: boolean;
  prestataire_nom?: string | null;
  prestataire_telephone?: string | null;
  cout_total: number;
  prochaine_date_maintenance?: string | null;
  prochain_kilo_maintenance?: number | null;
  statut: StatutIntervention;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface InterventionDetail extends Intervention {
  pieces_consommees: PieceConsommeeItem[];
  mecaniciens_participants: MecanicienParticipantItem[];
  documents: InterventionDocument[];
  total_pieces_utilisees: number;
}

export interface InterventionListResponse {
  items: Intervention[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
