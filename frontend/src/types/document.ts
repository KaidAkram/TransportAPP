export interface DocumentResponse {
  id: string;
  nom: string;
  document_type: string;
  type?: string | null;
  description?: string | null;
  date_emission?: string | null;
  date_expiration?: string | null;
  statut_validite: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  url_fichier: string;
  download_url: string;
  view_url: string;
  mime_type: string;
  size: number;
  size_formatted: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
}

export interface DocumentListResponse {
  items: DocumentResponse[];
  total: number;
  entity_type: string;
  entity_id: string;
}
