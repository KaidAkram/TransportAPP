from datetime import date as dt_date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import StatutVehicule


class VehiculeBase(BaseModel):
  immatriculation: str = Field(..., description="Immatriculation unique du véhicule (ex: 16-123456-00)")
  marque: str = Field(..., description="Marque du constructeur (ex: Mercedes-Benz)")
  modele: str = Field(..., description="Modèle (ex: Tourismo)")
  type: str = Field("Bus", description="Type (Bus, Minibus, Voiture, Van, Autre)")
  nombre_places: int = Field(1, ge=1, description="Nombre total de places assises")
  annee: Optional[int] = Field(None, ge=1970, le=2035, description="Année de fabrication")
  date_mise_circulation: Optional[dt_date] = Field(None, description="Date de première mise en circulation")
  kilometrage_actuel: float = Field(0.0, ge=0.0, description="Kilométrage au compteur")
  statut: StatutVehicule = Field(StatutVehicule.DISPONIBLE, description="Statut opérationnel actuel")
  cout_total: float = Field(0.0, ge=0.0, description="Coût total cumulé (TCO)")


class VehiculeCreate(VehiculeBase):
  pass


class VehiculeUpdate(BaseModel):
  immatriculation: Optional[str] = None
  marque: Optional[str] = None
  modele: Optional[str] = None
  type: Optional[str] = None
  nombre_places: Optional[int] = Field(None, ge=1)
  annee: Optional[int] = Field(None, ge=1970, le=2035)
  date_mise_circulation: Optional[dt_date] = None
  kilometrage_actuel: Optional[float] = Field(None, ge=0.0)
  statut: Optional[StatutVehicule] = None
  cout_total: Optional[float] = Field(None, ge=0.0)


class DocumentSummary(BaseModel):
  id: UUID
  nom: str
  type: str
  url_fichier: str
  date_emission: Optional[dt_date] = None
  date_expiration: Optional[dt_date] = None
  statut_validite: Optional[str] = None

  model_config = ConfigDict(from_attributes=True)


class ConstatSummary(BaseModel):
  id: UUID
  date: dt_date
  heure: Optional[str] = None
  lieu: str
  circonstances: str
  dommages: str
  tiers_implique: bool
  infos_tiers: Optional[str] = None

  model_config = ConfigDict(from_attributes=True)


class InterventionSummary(BaseModel):
  id: UUID
  numero: str
  type: str
  categorie: str
  date: dt_date
  kilometrage: float
  travail_effectue: Optional[str] = None
  cout_total: float
  statut: str
  mecanicien_nom: Optional[str] = None

  model_config = ConfigDict(from_attributes=True)


class VehiculeRead(VehiculeBase):
  id: UUID
  created_at: datetime
  updated_at: datetime
  archived_at: Optional[datetime] = None

  model_config = ConfigDict(from_attributes=True)


class VehiculeDetail(VehiculeRead):
  documents: List[DocumentSummary] = []
  constats: List[ConstatSummary] = []
  interventions: List[InterventionSummary] = []
  total_constats: int = 0
  total_interventions: int = 0
  documents_valides: int = 0
  documents_expires: int = 0
  documents_alertes: int = 0


class VehiculeListResponse(BaseModel):
  items: List[VehiculeRead]
  total: int
  page: int
  per_page: int
  total_pages: int
