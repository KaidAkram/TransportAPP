from datetime import date as dt_date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    nom: str = Field(..., description="Nom du document (ex: Police Assurance 2026)")
    type: str = Field(..., description="Type (Assurance, Contrôle technique, Carte grise, etc.)")
    url_fichier: str = Field(..., description="Chemin ou URL du fichier dans Supabase Storage")
    date_emission: Optional[dt_date] = Field(None, description="Date d'émission")
    date_expiration: Optional[dt_date] = Field(None, description="Date d'expiration")


class DocumentCreate(DocumentBase):
    entity_type: str = Field("vehicule", description="Type d'entité rattachée (vehicule, employe, etc.)")
    entity_id: UUID = Field(..., description="ID de l'entité rattachée")


class DocumentRead(DocumentBase):
    id: UUID
    statut_validite: Optional[str] = None
    entity_type: str
    entity_id: UUID
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
