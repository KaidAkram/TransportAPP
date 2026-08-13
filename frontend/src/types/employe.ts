export type StatutEmploye = "ACTIF" | "ABSENT" | "SUSPENDU" | "QUITTE";
export type TypeEmploye = "CHAUFFEUR" | "MECANICIEN" | "ADMINISTRATIF";

export interface Permis {
  id: string;
  chauffeur_id: string;
  numero: string;
  categories: string;
  date_obtention?: string | null;
  date_expiration?: string | null;
  scan_permis?: string | null;
  statut_validite?: "Valide" | "Expire bientôt" | "Expiré" | null;
  created_at: string;
  updated_at: string;
}

export interface MechanicIntervention {
  id: string;
  numero: string;
  vehicule_id: string;
  vehicule_immatriculation?: string | null;
  date: string;
  type: string;
  categorie: string;
  statut: string;
  probleme_constate?: string | null;
  travail_effectue?: string | null;
  est_responsable: boolean;
}

export interface EmployeDocument {
  id: string;
  nom: string;
  type: string;
  url_fichier: string;
  date_emission?: string | null;
  date_expiration?: string | null;
  statut_validite?: "Valide" | "Expire bientôt" | "Expiré" | null;
}

export interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  photo?: string | null;
  date_naissance?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  date_embauche?: string | null;
  statut: StatutEmploye;
  type_employe: TypeEmploye;
  fonction?: string | null;
  
  // Chauffeur fields
  assurance?: boolean | null;
  
  // Mecanicien fields
  specialite?: string | null;
  type_mecanicien?: string | null;
  experience?: string | null;
  est_responsable?: boolean | null;

  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface EmployeDetail extends Employe {
  permis?: Permis | null;
  documents: EmployeDocument[];
  interventions: MechanicIntervention[];
  total_interventions: number;
  documents_valides: number;
  documents_alertes: number;
  documents_expires: number;
}

export interface EmployeListResponse {
  items: Employe[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
