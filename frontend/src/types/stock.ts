export type TypeMouvement = "ENTREE"| "SORTIE"| "INVENTAIRE";
export type StatutStock = "NORMAL"| "FAIBLE"| "RUPTURE";

export interface MouvementStock {
 id: string;
 piece_id: string;
 piece_reference?: string | null;
 piece_designation?: string | null;
 type: TypeMouvement;
 quantite: number;
 date: string;
 motif: string;
 ecart_inventaire?: number | null;
 intervention_id?: string | null;
 intervention_numero?: string | null;
 fournisseur_id?: string | null;
 fournisseur_nom?: string | null;
 reference_document?: string | null;
 created_at: string;
 updated_at: string;
}

export interface Piece {
 id: string;
 reference: string;
 designation: string;
 categorie: string;
 marque?: string | null;
 modele_compatibilite?: string | null;
 unite: string;
 stock_actuel: number;
 stock_minimum: number;
 emplacement?: string | null;
 description?: string | null;
 statut_stock: StatutStock;
 created_at: string;
 updated_at: string;
 archived_at?: string | null;
}

export interface PieceDetail extends Piece {
 mouvements: MouvementStock[];
 total_entrees: number;
 total_sorties: number;
}

export interface PieceListResponse {
 items: Piece[];
 total: number;
 page: number;
 per_page: number;
 total_pages: number;
 total_references: number;
 total_stock_normal: number;
 total_stock_faible: number;
 total_rupture: number;
}

export interface MouvementStockListResponse {
 items: MouvementStock[];
 total: number;
 page: number;
 per_page: number;
 total_pages: number;
}
