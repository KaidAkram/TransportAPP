from datetime import date as dt_date, datetime
from typing import Optional, List, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import StatutEmploye, TypeEmploye
from app.schemas.document import DocumentSummary


# ----------------------------------------------------
# Permis Schemas
# ----------------------------------------------------
class PermisBase(BaseModel):
    numero: str = Field(..., description="Numéro unique du permis de conduire (ex: DZ-31-987654)")
    categories: str = Field(..., description="Catégories obtenues séparées par virgules (ex: B, D, D1)")
    date_obtention: Optional[dt_date] = Field(None, description="Date d'obtention initiale")
    date_expiration: Optional[dt_date] = Field(None, description="Date d'expiration")
    scan_permis: Optional[str] = Field(None, description="URL / chemin du document numérisé")


class PermisCreate(PermisBase):
    pass


class PermisUpdate(BaseModel):
    numero: Optional[str] = None
    categories: Optional[str] = None
    date_obtention: Optional[dt_date] = None
    date_expiration: Optional[dt_date] = None
    scan_permis: Optional[str] = None


class PermisRead(PermisBase):
    id: UUID
    chauffeur_id: UUID
    statut_validite: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Intervention Summary for Mechanics
# ----------------------------------------------------
class MechanicInterventionSummary(BaseModel):
    id: UUID
    numero: str
    vehicule_id: UUID
    vehicule_immatriculation: Optional[str] = None
    date: dt_date
    type: str
    categorie: str
    statut: str
    probleme_constate: Optional[str] = None
    travail_effectue: Optional[str] = None
    est_responsable: bool = False

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Base Employe Schemas
# ----------------------------------------------------
class EmployeBase(BaseModel):
    matricule: str = Field(..., description="Matricule unique de l'employé (ex: CH-001, MEC-001)")
    nom: str = Field(..., description="Nom de famille")
    prenom: str = Field(..., description="Prénom")
    photo: Optional[str] = Field(None, description="URL de la photo de profil / avatar")
    date_naissance: Optional[dt_date] = Field(None, description="Date de naissance")
    telephone: Optional[str] = Field(None, description="Numéro de téléphone")
    adresse: Optional[str] = Field(None, description="Adresse de résidence")
    date_embauche: Optional[dt_date] = Field(None, description="Date de recrutement")
    statut: StatutEmploye = Field(StatutEmploye.ACTIF, description="Statut RH actuel")
    type_employe: TypeEmploye = Field(..., description="Discriminateur STI (CHAUFFEUR ou MECANICIEN)")
    fonction: Optional[str] = Field(None, description="Intitulé du poste")


class EmployeCreate(EmployeBase):
    # Chauffeur specific
    assurance: Optional[bool] = Field(True, description="Assurance chauffeur active")
    
    # Mecanicien specific
    specialite: Optional[str] = Field(None, description="Spécialité technique (Moteur, Freinage, Électricité)")
    type_mecanicien: Optional[str] = Field(None, description="Grade (Chef d'atelier, Technicien)")
    experience: Optional[str] = Field(None, description="Années d'expérience")
    est_responsable: Optional[bool] = Field(False, description="Responsable d'atelier")

    # Initial Permis if Chauffeur
    permis_numero: Optional[str] = None
    permis_categories: Optional[str] = None
    permis_date_obtention: Optional[dt_date] = None
    permis_date_expiration: Optional[dt_date] = None
    permis_scan: Optional[str] = None


class EmployeUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    photo: Optional[str] = None
    date_naissance: Optional[dt_date] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    date_embauche: Optional[dt_date] = None
    statut: Optional[StatutEmploye] = None
    fonction: Optional[str] = None
    
    # Chauffeur fields
    assurance: Optional[bool] = None
    
    # Mecanicien fields
    specialite: Optional[str] = None
    type_mecanicien: Optional[str] = None
    experience: Optional[str] = None
    est_responsable: Optional[bool] = None


class EmployeRead(EmployeBase):
    id: UUID
    assurance: Optional[bool] = None
    specialite: Optional[str] = None
    type_mecanicien: Optional[str] = None
    experience: Optional[str] = None
    est_responsable: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeDetail(EmployeRead):
    permis: Optional[PermisRead] = None
    documents: List[DocumentSummary] = []
    interventions: List[MechanicInterventionSummary] = []
    total_interventions: int = 0
    documents_valides: int = 0
    documents_alertes: int = 0
    documents_expires: int = 0


class EmployeListResponse(BaseModel):
    items: List[EmployeRead]
    total: int
    page: int
    per_page: int
    total_pages: int
