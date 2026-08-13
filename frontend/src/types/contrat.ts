export type StatutContrat = "ACTIF" | "EXPIRE";

export interface Avenant {
  id: string;
  contrat_id: string;
  numero: string;
  date: string;
  objet: string;
  description?: string | null;
  modif_montant?: number | null;
  nouvelle_date_fin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CautionSummary {
  id: string;
  numero: string;
  type: string;
  montant: number;
  devise: string;
  statut: string;
  date_emission: string;
  date_echeance?: string | null;
  url_caution_pdf?: string | null;
}

export interface ContratDocument {
  id: string;
  nom: string;
  type: string;
  url_fichier: string;
  date_emission?: string | null;
  date_expiration?: string | null;
  statut_validite?: "Valide" | "Expire bientôt" | "Expiré" | null;
}

export interface Contrat {
  id: string;
  reference: string;
  partenaire_id: string;
  partenaire_nom?: string | null;
  partenaire_role?: string | null;
  objet: string;
  type_contrat: string;
  date_debut: string;
  date_fin: string;
  montant: number;
  devise: string;
  mode_facturation?: string | null;
  conditions_paiement?: string | null;
  statut: StatutContrat;
  jours_restants?: number | null;
  alerte_expiration?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface ContratDetail extends Contrat {
  avenants: Avenant[];
  cautions: CautionSummary[];
  documents: ContratDocument[];
  total_avenants: number;
  total_cautions: number;
  total_documents: number;
  montant_total_avec_avenants: number;
}

export interface ContratListResponse {
  items: Contrat[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
