from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
  nom: str
  document_type: str = "Autre"
  type: Optional[str] = None
  description: Optional[str] = None
  date_emission: Optional[date] = None
  date_expiration: Optional[date] = None
  statut_validite: Optional[str] = "Valide"


class DocumentCreate(DocumentBase):
  entity_type: str
  entity_id: UUID
  url_fichier: Optional[str] = None


class DocumentResponse(DocumentBase):
  id: UUID
  entity_type: str
  entity_id: UUID
  filename: Optional[str] = None
  url_fichier: str
  download_url: Optional[str] = None
  view_url: Optional[str] = None
  mime_type: Optional[str] = None
  size: Optional[int] = 0
  size_formatted: Optional[str] = None
  uploaded_by: Optional[str] = "admin"
  uploaded_at: datetime
  created_at: datetime

  model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
  items: List[DocumentResponse]
  total: int
  entity_type: str
  entity_id: UUID


# Backward compatibility aliases
DocumentRead = DocumentResponse
DocumentSummary = DocumentResponse
