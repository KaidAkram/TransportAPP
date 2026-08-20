export type StatutFacture = "EN_ATTENTE" | "PAYEE" | "EN_RETARD" | "ANNULEE";
export type ModePaiement = "ESPECE" | "VIREMENT" | "CHEQUE" | "CARTE";
export type CategorieDepenseVehicule =
  | "CARBURANT"
  | "PEAGE"
  | "PNEU"
  | "ASSURANCE"
  | "ENTRETIEN"
  | "REPARATION"
  | "PERSONNEL"
  | "AMORTISSEMENT"
  | "AUTRE";

export interface Facture {
  id: string;
  numero: string;
  client_id: string;
  client_nom?: string;
  date_facture: string;
  mois_realisation: string;
  montant_facture: number;
  statut: StatutFacture;
  remarques?: string | null;
  mode_reglement?: ModePaiement | null;
  date_reglement?: string | null;
  url_document_reglement?: string | null;
  created_at: string;
}

export interface FactureListResponse {
  items: Facture[];
  total: number;
  total_montant: number;
  total_encaisse: number;
  total_en_attente: number;
}

export interface DepenseVehicule {
  id: string;
  vehicule_id: string;
  categorie: CategorieDepenseVehicule;
  date: string;
  montant: number;
  kilometrage?: number | null;
  fournisseur?: string | null;
  justificatif?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface TCOAnalysis {
  vehicule_id: string;
  immatriculation: string;
  marque_modele: string;
  kilometrage_actuel: number;
  total_tco_dzd: number;
  cout_par_km_dzd: number;
  depenses_par_categorie: Record<string, number>;
  historique_depenses: DepenseVehicule[];
}
