from datetime import date as dt_date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import RolePartenaire, TypePartenaire
from app.schemas.document import DocumentSummary


# ----------------------------------------------------
# Contact Schemas
# ----------------------------------------------------
class ContactBase(BaseModel):
    nom: str = Field(..., description="Nom de famille du contact")
    prenom: str = Field(..., description="Prénom")
    fonction: Optional[str] = Field(None, description="Fonction au sein de l'entreprise (ex: DG, Responsable Achats)")
    telephone: Optional[str] = Field(None, description="Numéro de téléphone direct / mobile")
    email: Optional[str] = Field(None, description="Adresse email professionnelle")
    whatsapp: Optional[str] = Field(None, description="Numéro WhatsApp")
    est_principal: bool = Field(False, description="Est-ce l'interlocuteur principal ?")
    notes: Optional[str] = Field(None, description="Notes ou observations particulières")


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    fonction: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    est_principal: Optional[bool] = None
    notes: Optional[str] = None


class ContactRead(ContactBase):
    id: UUID
    partenaire_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# CRM Note Schemas
# ----------------------------------------------------
class CRMNoteBase(BaseModel):
    type: str = Field("Note", description="Type d'interaction (Appel, Email, Réunion, Note)")
    auteur: str = Field("Administrateur", description="Auteur de la note")
    date: dt_date = Field(..., description="Date de l'interaction")
    contenu: str = Field(..., description="Compte-rendu détaillé")


class CRMNoteCreate(CRMNoteBase):
    pass


class CRMNoteRead(CRMNoteBase):
    id: UUID
    partenaire_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Partenaire Schemas
# ----------------------------------------------------
class PartenaireBase(BaseModel):
    nom_commercial: str = Field(..., description="Raison sociale ou Nom commercial (ex: Agence Voyages Oran Étoile)")
    logo: Optional[str] = Field(None, description="URL du logo d'entreprise")
    nif: Optional[str] = Field(None, description="Numéro d'Identification Fiscale (15 chiffres)")
    nis: Optional[str] = Field(None, description="Numéro d'Identification Statistique")
    registre_commerce: Optional[str] = Field(None, description="Numéro du Registre de Commerce (RC)")
    article_imposition: Optional[str] = Field(None, description="Numéro de l'Article d'Imposition (AI)")
    adresse: Optional[str] = Field(None, description="Adresse du siège / locaux")
    wilaya: Optional[str] = Field(None, description="Wilaya (ex: Oran, Alger, Constantine)")
    commune: Optional[str] = Field(None, description="Commune")
    code_postal: Optional[str] = Field(None, description="Code postal")
    telephone_principal: Optional[str] = Field(None, description="Téléphone standard / principal")
    email: Optional[str] = Field(None, description="Email commercial / général")
    site_web: Optional[str] = Field(None, description="Site Internet de l'entreprise")
    statut_crm: str = Field("Actif", description="Statut CRM (Actif, Prospect, Inactif, Bloqué)")
    role_partenaire: RolePartenaire = Field(..., description="Rôle CRM (CLIENT, FOURNISSEUR, PARTENAIRE_MIXTE)")

    # Client specific
    type_client: Optional[TypePartenaire] = Field(None, description="Catégorie client (AGENCE_VOYAGE, ENTREPRISE, etc.)")

    # Fournisseur specific
    specialite: Optional[str] = Field(None, description="Spécialité / Catalogue fournisseur (Pièces, Carburant, Pneumatiques)")


class PartenaireCreate(PartenaireBase):
    contacts: List[ContactCreate] = Field(default=[], description="Liste initiale de contacts à créer")


class PartenaireUpdate(BaseModel):
    nom_commercial: Optional[str] = None
    logo: Optional[str] = None
    nif: Optional[str] = None
    nis: Optional[str] = None
    registre_commerce: Optional[str] = None
    article_imposition: Optional[str] = None
    adresse: Optional[str] = None
    wilaya: Optional[str] = None
    commune: Optional[str] = None
    code_postal: Optional[str] = None
    telephone_principal: Optional[str] = None
    email: Optional[str] = None
    site_web: Optional[str] = None
    statut_crm: Optional[str] = None
    role_partenaire: Optional[RolePartenaire] = None
    type_client: Optional[TypePartenaire] = None
    specialite: Optional[str] = None


class PartenaireRead(PartenaireBase):
    id: UUID
    contact_principal: Optional[ContactRead] = None
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PartenaireDetail(PartenaireRead):
    contacts: List[ContactRead] = []
    documents: List[DocumentSummary] = []
    crm_notes: List[CRMNoteRead] = []
    total_contacts: int = 0
    total_documents: int = 0
    total_notes: int = 0


class PartenaireListResponse(BaseModel):
    items: List[PartenaireRead]
    total: int
    page: int
    per_page: int
    total_pages: int
