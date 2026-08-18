export type TypeCaution = "SOUMISSION"| "BONNE_EXECUTION"| "DEMANDE";
export type StatutCaution = "CREATION"| "CHEZ_CLIENT"| "RETOURNEE"| "MAIN_LEVEE";

export interface CautionDocument {
 id: string;
 nom: string;
 type: string;
 url_fichier: string;
 date_emission?: string | null;
 date_expiration?: string | null;
 statut_validite?: "Valide"| "Expire bientôt"| "Expiré"| null;
}

export interface Caution {
 id: string;
 numero: string;
 type: TypeCaution;
 client_id: string;
 client_nom?: string | null;
 contrat_id?: string | null;
 contrat_reference?: string | null;
 montant: number;
 devise: string;
 reference_type?: string | null;
 reference_numero: string;
 objet: string;
 date_emission: string;
 date_echeance?: string | null;
 date_retour?: string | null;
 statut: StatutCaution;
  banque_emetteur?: string | null;
  lieu_demande?: string | null;
  lieu_soumission?: string | null;
  numero_compte_bancaire?: string | null;
  societe_nom?: string | null;
  url_caution_pdf?: string | null;
 url_main_levee_pdf?: string | null;
 created_at: string;
 updated_at: string;
 archived_at?: string | null;
}

export interface CautionDetail extends Caution {
 documents: CautionDocument[];
}

export interface CautionListResponse {
 items: Caution[];
 total: number;
 page: number;
 per_page: number;
 total_pages: number;
}
