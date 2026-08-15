export type StatutDevis = "BROUILLON"| "ENVOYE"| "ACCEPTE"| "REFUSE"| "EXPIRE";
export type StatutFacture = "EN_ATTENTE"| "PARTIEL"| "PAYE"| "RETARD"| "ANNULEE";
export type ModePaiement = "ESPECE"| "VIREMENT"| "CHEQUE"| "CARTE";
export type StatutPaiement = "EN_ATTENTE"| "VALIDE"| "REJETE";
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

export interface DevisLigne {
 id: string;
 devis_id: string;
 service: string;
 description: string;
 quantite: number;
 prix_unitaire: number;
 total_ligne: number;
}

export interface Devis {
 id: string;
 numero: string;
 client_id: string;
 client_nom?: string;
 contrat_id?: string | null;
 date_emission: string;
 date_validite: string;
 statut: StatutDevis;
 objet: string;
 conditions_reglement?: string | null;
 total_ht: number;
 taux_tva: number;
 montant_tva: number;
 total_ttc: number;
 url_pdf?: string | null;
 created_at: string;
 lignes: DevisLigne[];
}

export interface DevisListResponse {
 items: Devis[];
 total: number;
}

export interface FactureLigne {
 id: string;
 facture_id: string;
 service: string;
 description: string;
 quantite: number;
 prix_unitaire: number;
 total_ligne: number;
}

export interface Paiement {
 id: string;
 facture_id: string;
 date: string;
 montant: number;
 mode: ModePaiement;
 reference: string;
 banque?: string | null;
 statut: StatutPaiement;
 notes?: string | null;
 created_at: string;
}

export interface Facture {
 id: string;
 numero: string;
 client_id: string;
 client_nom?: string;
 contrat_id?: string | null;
 devis_id?: string | null;
 mission_id?: string | null;
 date_emission: string;
 date_echeance: string;
 statut: StatutFacture;
 mode_reglement: ModePaiement;
 total_ht: number;
 taux_tva: number;
 montant_tva: number;
 total_ttc: number;
 montant_paye: number;
 montant_restant: number;
 notes?: string | null;
 url_pdf?: string | null;
 created_at: string;
 lignes: FactureLigne[];
 paiements: Paiement[];
}

export interface FactureListResponse {
 items: Facture[];
 total: number;
 total_chiffre_affaires: number;
 total_encaisse: number;
 total_creances: number;
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
