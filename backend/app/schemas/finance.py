from datetime import date as dt_date, datetime as dt_datetime
from typing import Optional, List, Dict, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import (
  StatutFacture,
  ModePaiement,
  CategorieDepenseVehicule,
)


# --- FACTURE SCHEMAS ---
class FactureCreate(BaseModel):
  client_id: Union[UUID, str]
  date_facture: dt_date = Field(default_factory=dt_date.today)
  mois_realisation: str
  montant_facture: float
  remarques: Optional[str] = None


class FactureResponse(BaseModel):
  id: UUID
  numero: str
  client_id: UUID
  date_facture: dt_date
  mois_realisation: str
  montant_facture: float
  statut: StatutFacture
  remarques: Optional[str] = None
  mode_reglement: Optional[ModePaiement] = None
  date_reglement: Optional[dt_date] = None
  url_document_reglement: Optional[str] = None
  created_at: dt_datetime
  client_nom: Optional[str] = None
  model_config = ConfigDict(from_attributes=True)


class FactureListResponse(BaseModel):
  items: List[FactureResponse]
  total: int
  total_montant: float
  total_encaisse: float
  total_en_attente: float


class EncaissementFacture(BaseModel):
  mode_reglement: ModePaiement
  date_reglement: dt_date = Field(default_factory=dt_date.today)


# --- DEPENSE VEHICULE & TCO SCHEMAS ---
class DepenseVehiculeCreate(BaseModel):
  vehicule_id: Union[UUID, str]
  categorie: CategorieDepenseVehicule
  date: dt_date = Field(default_factory=dt_date.today)
  montant: float
  kilometrage: Optional[float] = None
  fournisseur: Optional[str] = None
  justificatif: Optional[str] = None
  notes: Optional[str] = None


class DepenseVehiculeResponse(BaseModel):
  id: UUID
  vehicule_id: UUID
  categorie: CategorieDepenseVehicule
  date: dt_date
  montant: float
  kilometrage: Optional[float] = None
  fournisseur: Optional[str] = None
  justificatif: Optional[str] = None
  notes: Optional[str] = None
  created_at: dt_datetime
  model_config = ConfigDict(from_attributes=True)


class TCOAnalysisResponse(BaseModel):
  vehicule_id: str
  immatriculation: str
  marque_modele: str
  kilometrage_actuel: float
  total_tco_dzd: float
  cout_par_km_dzd: float
  depenses_par_categorie: Dict[str, float]
  historique_depenses: List[DepenseVehiculeResponse]
