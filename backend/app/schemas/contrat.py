from datetime import date as dt_date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import StatutContrat
from app.schemas.document import DocumentSummary


# ----------------------------------------------------
# Avenant (Contract Amendment) Schemas
# ----------------------------------------------------
class AvenantBase(BaseModel):
  numero: str = Field(..., description="Numéro ou référence de l'avenant (ex: Avenant N°01)")
  date: dt_date = Field(..., description="Date de signature de l'avenant")
  objet: str = Field(..., description="Objet de la modification contractuelle")
  description: Optional[str] = Field(None, description="Détails et clauses modifiées")
  modif_montant: Optional[float] = Field(None, description="Variation financière (+ ou - montant)")
  nouvelle_date_fin: Optional[dt_date] = Field(None, description="Nouvelle date de clôture du contrat")


class AvenantCreate(AvenantBase):
  pass


class AvenantRead(AvenantBase):
  id: UUID
  contrat_id: UUID
  created_at: datetime
  updated_at: datetime

  model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Caution Summary for Contract Dossier
# ----------------------------------------------------
class CautionSummary(BaseModel):
  id: UUID
  numero: str
  type: str
  montant: float
  devise: str = "DZD"
  statut: str
  date_emission: dt_date
  date_echeance: Optional[dt_date] = None
  url_caution_pdf: Optional[str] = None

  model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Contrat Schemas
# ----------------------------------------------------
class ContratBase(BaseModel):
  reference: str = Field(..., description="Référence unique du contrat (ex: CTR-2026-001)")
  partenaire_id: UUID = Field(..., description="ID du client ou fournisseur contractant")
  objet: str = Field(..., description="Objet du contrat ou convention")
  type_contrat: str = Field("Transport", description="Type de contrat (Transport, Location, Maintenance, Prestation)")
  date_debut: dt_date = Field(..., description="Date d'effet / début")
  date_fin: dt_date = Field(..., description="Date de clôture / échéance")
  montant: float = Field(..., ge=0.0, description="Montant total contractuel")
  devise: str = Field("DZD", description="Devise contractuelle")
  mode_facturation: Optional[str] = Field("Mensuel", description="Mode de facturation (Mensuel, Au voyage, Forfait)")
  conditions_paiement: Optional[str] = Field(None, description="Modalités de règlement (Virement 30j, etc.)")
  statut: StatutContrat = Field(StatutContrat.ACTIF, description="Statut du contrat (ACTIF ou EXPIRE)")


class ContratCreate(ContratBase):
  pass


class ContratUpdate(BaseModel):
  objet: Optional[str] = None
  type_contrat: Optional[str] = None
  date_debut: Optional[dt_date] = None
  date_fin: Optional[dt_date] = None
  montant: Optional[float] = Field(None, ge=0.0)
  devise: Optional[str] = None
  mode_facturation: Optional[str] = None
  conditions_paiement: Optional[str] = None
  statut: Optional[StatutContrat] = None


class ContratRead(ContratBase):
  id: UUID
  partenaire_nom: Optional[str] = None
  partenaire_role: Optional[str] = None
  jours_restants: Optional[int] = None
  alerte_expiration: Optional[str] = None
  created_at: datetime
  updated_at: datetime
  archived_at: Optional[datetime] = None

  model_config = ConfigDict(from_attributes=True)


class ContratDetail(ContratRead):
  avenants: List[AvenantRead] = []
  cautions: List[CautionSummary] = []
  documents: List[DocumentSummary] = []
  total_avenants: int = 0
  total_cautions: int = 0
  total_documents: int = 0
  montant_total_avec_avenants: float = 0.0


class ContratListResponse(BaseModel):
  items: List[ContratRead]
  total: int
  page: int
  per_page: int
  total_pages: int
