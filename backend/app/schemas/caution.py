from datetime import date as dt_date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import TypeCaution, StatutCaution
from app.schemas.document import DocumentSummary


class CautionBase(BaseModel):
  numero: Optional[str] = Field(None, description="Numéro unique de la caution bancaire (ex: CAU-2026-001)")
  type: TypeCaution = Field(..., description="Type de caution (SOUMISSION ou BONNE_EXECUTION)")
  client_id: UUID = Field(..., description="ID du client bénéficiaire")
  contrat_id: Optional[UUID] = Field(None, description="ID du contrat rattaché (optionnel pour Soumission)")
  montant: float = Field(..., ge=0.0, description="Montant cautionné (garantie financière)")
  devise: str = Field("DZD", description="Devise de la caution")
  reference_type: Optional[str] = Field("Contrat", description="Type de référence (Appel d'offres, Contrat, Consultation)")
  reference_numero: Optional[str] = Field(None, description="Numéro de l'AO ou du contrat")
  objet: str = Field(..., description="Objet précis de la caution / engagement bancaire")
  date_emission: dt_date = Field(..., description="Date d'émission de l'acte de caution")
  date_echeance: Optional[dt_date] = Field(None, description="Date de fin de validité / échéance")
  statut: StatutCaution = Field(StatutCaution.CREATION, description="Statut de gestion de la caution")
  banque_emetteur: Optional[str] = Field("Banque Nationale d'Algérie (BNA)", description="Banque garante émettrice")
  url_caution_pdf: Optional[str] = Field(None, description="URL / chemin du document PDF officiel généré")


class CautionCreate(CautionBase):
  pass


class CautionUpdate(BaseModel):
  montant: Optional[float] = Field(None, ge=0.0)
  devise: Optional[str] = None
  reference_type: Optional[str] = None
  reference_numero: Optional[str] = None
  objet: Optional[str] = None
  date_emission: Optional[dt_date] = None
  date_echeance: Optional[dt_date] = None
  statut: Optional[StatutCaution] = None
  banque_emetteur: Optional[str] = None
  url_caution_pdf: Optional[str] = None


class CautionRead(CautionBase):
  id: UUID
  client_nom: Optional[str] = None
  contrat_reference: Optional[str] = None
  created_at: datetime
  updated_at: datetime
  archived_at: Optional[datetime] = None

  model_config = ConfigDict(from_attributes=True)


class CautionDetail(CautionRead):
  documents: List[DocumentSummary] = []


class CautionListResponse(BaseModel):
  items: List[CautionRead]
  total: int
  page: int
  per_page: int
  total_pages: int
