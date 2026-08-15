export type RolePartenaire = "CLIENT"| "FOURNISSEUR"| "PARTENAIRE_MIXTE";
export type TypePartenaire =
 | "AGENCE_VOYAGE"
 | "ENTREPRISE"
 | "HOTEL"
 | "ORGANISME"
 | "ASSOCIATION"
 | "PARTICULIER"
 | "AUTRE";

export interface Contact {
 id: string;
 partenaire_id: string;
 nom: string;
 prenom: string;
 fonction?: string | null;
 telephone?: string | null;
 email?: string | null;
 whatsapp?: string | null;
 est_principal: boolean;
 notes?: string | null;
 created_at: string;
 updated_at: string;
}

export interface CRMNote {
 id: string;
 partenaire_id: string;
 type: string; // Appel, Email, Réunion, Note
 auteur: string;
 date: string;
 contenu: string;
 created_at: string;
 updated_at: string;
}

export interface PartenaireDocument {
 id: string;
 nom: string;
 type: string;
 url_fichier: string;
 date_emission?: string | null;
 date_expiration?: string | null;
 statut_validite?: "Valide"| "Expire bientôt"| "Expiré"| null;
}

export interface Partenaire {
 id: string;
 nom_commercial: string;
 logo?: string | null;
 nif?: string | null;
 nis?: string | null;
 registre_commerce?: string | null;
 article_imposition?: string | null;
 adresse?: string | null;
 wilaya?: string | null;
 commune?: string | null;
 code_postal?: string | null;
 telephone_principal?: string | null;
 email?: string | null;
 site_web?: string | null;
 statut_crm: string; // Actif, Prospect, Inactif, Bloqué
 role_partenaire: RolePartenaire;
 type_client?: TypePartenaire | null;
 specialite?: string | null;
 contact_principal?: Contact | null;
 created_at: string;
 updated_at: string;
 archived_at?: string | null;
}

export interface PartenaireDetail extends Partenaire {
 contacts: Contact[];
 documents: PartenaireDocument[];
 crm_notes: CRMNote[];
 total_contacts: number;
 total_documents: number;
 total_notes: number;
}

export interface PartenaireListResponse {
 items: Partenaire[];
 total: number;
 page: number;
 per_page: number;
 total_pages: number;
}
