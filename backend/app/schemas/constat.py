from datetime import date as dt_date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ConstatBase(BaseModel):
  vehicule_id: UUID = Field(..., description="ID du véhicule concerné")
  chauffeur_id: Optional[UUID] = Field(None, description="ID du chauffeur au volant (optionnel)")
  date: dt_date = Field(..., description="Date de survenance de l'accident")
  heure: Optional[str] = Field(None, description="Heure de l'accident (ex: 14h30)")
  lieu: str = Field(..., description="Lieu précis du sinistre")
  circonstances: str = Field(..., description="Circonstances détaillées de l'accident")
  dommages: str = Field(..., description="Dommages matériels constatés")
  tiers_implique: bool = Field(False, description="Y a-t-il un tiers impliqué ?")
  infos_tiers: Optional[str] = Field(None, description="Coordonnées, véhicule et assurance du tiers")
  
  # Insurance tracking
  statut_assurance: str = Field("En attente", description="Statut de remboursement par l'assurance")
  montant_rembourse: Optional[float] = Field(None, description="Montant remboursé par l'assurance")
  url_document: Optional[str] = Field(None, description="URL du document (scanné) du constat")
  url_justificatif_assurance: Optional[str] = Field(None, description="URL du justificatif d'assurance (reçu/refus)")


class ConstatCreate(ConstatBase):
  pass

class ConstatUpdate(BaseModel):
  chauffeur_id: Optional[UUID] = None
  date: Optional[dt_date] = None
  heure: Optional[str] = None
  lieu: Optional[str] = None
  circonstances: Optional[str] = None
  dommages: Optional[str] = None
  tiers_implique: Optional[bool] = None
  infos_tiers: Optional[str] = None
  
  statut_assurance: Optional[str] = None
  montant_rembourse: Optional[float] = None
  url_document: Optional[str] = None
  url_justificatif_assurance: Optional[str] = None
class ConstatRead(ConstatBase):
  id: UUID
  created_at: datetime
  updated_at: datetime
  archived_at: Optional[datetime] = None

  model_config = ConfigDict(from_attributes=True)
