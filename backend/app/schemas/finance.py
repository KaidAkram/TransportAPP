from datetime import date as dt_date, datetime as dt_datetime
from typing import Optional, List, Dict, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import (
  StatutDevis,
  StatutFacture,
  ModePaiement,
  StatutPaiement,
  CategorieDepenseVehicule,
)


# --- DEVIS SCHEMAS ---
class DevisLigneBase(BaseModel):
  service: str
  description: str
  quantite: float = 1.0
  prix_unitaire: float
  total_ligne: Optional[float] = None


class DevisLigneCreate(DevisLigneBase):
  pass


class DevisLigneResponse(DevisLigneBase):
  id: UUID
  devis_id: UUID
  model_config = ConfigDict(from_attributes=True)


class DevisBase(BaseModel):
  client_id: UUID
  date_emission: dt_date = Field(default_factory=dt_date.today)
  date_validite: dt_date
  objet: str
  conditions_reglement: Optional[str] = None
  taux_tva: float = 19.0


class DevisCreate(BaseModel):
  client_id: Union[UUID, str]
  date_emission: dt_date = Field(default_factory=dt_date.today)
  date_validite: dt_date
  objet: str
  conditions_reglement: Optional[str] = None
  taux_tva: float = 19.0
  numero: Optional[str] = None
  lignes: List[DevisLigneCreate] = []


class DevisUpdate(BaseModel):
  client_id: Optional[Union[UUID, str]] = None
  date_validite: Optional[dt_date] = None
  statut: Optional[StatutDevis] = None
  objet: Optional[str] = None
  conditions_reglement: Optional[str] = None
  taux_tva: Optional[float] = None
  lignes: Optional[List[DevisLigneCreate]] = None


class DevisResponse(BaseModel):
  id: UUID
  numero: str
  client_id: UUID
  contrat_id: Optional[UUID] = None
  date_emission: dt_date
  date_validite: dt_date
  statut: StatutDevis
  objet: str
  conditions_reglement: Optional[str] = None
  total_ht: float
  taux_tva: float
  montant_tva: float
  total_ttc: float
  url_pdf: Optional[str] = None
  created_at: dt_datetime
  client_nom: Optional[str] = None
  lignes: List[DevisLigneResponse] = []
  model_config = ConfigDict(from_attributes=True)


class DevisListResponse(BaseModel):
  items: List[DevisResponse]
  total: int


# --- PAIEMENT SCHEMAS ---
class PaiementCreate(BaseModel):
  date: dt_date = Field(default_factory=dt_date.today)
  montant: float
  mode: ModePaiement = ModePaiement.VIREMENT
  reference: str
  banque: Optional[str] = None
  notes: Optional[str] = None


class PaiementResponse(BaseModel):
  id: UUID
  facture_id: UUID
  date: dt_date
  montant: float
  mode: ModePaiement
  reference: str
  banque: Optional[str] = None
  statut: StatutPaiement
  notes: Optional[str] = None
  created_at: dt_datetime
  model_config = ConfigDict(from_attributes=True)


# --- FACTURE SCHEMAS ---
class FactureLigneBase(BaseModel):
  service: str
  description: str
  quantite: float = 1.0
  prix_unitaire: float
  total_ligne: Optional[float] = None


class FactureLigneCreate(FactureLigneBase):
  pass


class FactureLigneResponse(FactureLigneBase):
  id: UUID
  facture_id: UUID
  model_config = ConfigDict(from_attributes=True)


class FactureCreate(BaseModel):
  client_id: Union[UUID, str]
  contrat_id: Optional[Union[UUID, str]] = None
  devis_id: Optional[Union[UUID, str]] = None
  date_emission: dt_date = Field(default_factory=dt_date.today)
  date_echeance: dt_date
  mode_reglement: ModePaiement = ModePaiement.VIREMENT
  taux_tva: float = 19.0
  notes: Optional[str] = None
  numero: Optional[str] = None
  lignes: List[FactureLigneCreate] = []


class FactureUpdate(BaseModel):
  client_id: Optional[Union[UUID, str]] = None
  date_echeance: Optional[dt_date] = None
  statut: Optional[StatutFacture] = None
  mode_reglement: Optional[ModePaiement] = None
  taux_tva: Optional[float] = None
  notes: Optional[str] = None
  lignes: Optional[List[FactureLigneCreate]] = None


class FactureResponse(BaseModel):
  id: UUID
  numero: str
  client_id: UUID
  contrat_id: Optional[UUID] = None
  devis_id: Optional[UUID] = None
  date_emission: dt_date
  date_echeance: dt_date
  statut: StatutFacture
  mode_reglement: ModePaiement
  total_ht: float
  taux_tva: float
  montant_tva: float
  total_ttc: float
  montant_paye: float
  montant_restant: float
  notes: Optional[str] = None
  url_pdf: Optional[str] = None
  created_at: dt_datetime
  client_nom: Optional[str] = None
  lignes: List[FactureLigneResponse] = []
  paiements: List[PaiementResponse] = []
  model_config = ConfigDict(from_attributes=True)


class FactureListResponse(BaseModel):
  items: List[FactureResponse]
  total: int
  total_chiffre_affaires: float
  total_encaisse: float
  total_creances: float


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
