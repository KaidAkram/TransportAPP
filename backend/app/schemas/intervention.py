from datetime import date as dt_date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import CategorieIntervention, StatutIntervention
from app.schemas.document import DocumentSummary


# ----------------------------------------------------
# Consumed Parts Sub-item
# ----------------------------------------------------
class PieceConsommeeItem(BaseModel):
  piece_id: UUID = Field(..., description="ID de la pièce détachée consommée")
  quantite: int = Field(1, gt=0, description="Quantité utilisée")
  reference: Optional[str] = None
  designation: Optional[str] = None
  unite: Optional[str] = None


class MecanicienParticipantItem(BaseModel):
  mecanicien_id: UUID
  nom: Optional[str] = None
  prenom: Optional[str] = None
  specialite: Optional[str] = None


# ----------------------------------------------------
# Intervention Schemas
# ----------------------------------------------------
class InterventionBase(BaseModel):
  numero: str = Field(..., description="Numéro unique d'ordre de travail (ex: INT-2026-00125)")
  vehicule_id: UUID = Field(..., description="ID du véhicule concerné")
  mecanicien_responsable_id: Optional[UUID] = Field(None, description="Chef d'équipe / mécanicien principal")
  type: CategorieIntervention = Field(CategorieIntervention.PREVENTIVE, description="Catégorie (PREVENTIVE ou CORRECTIVE)")
  categorie: str = Field("Révision générale", description="Type d'opération (Vidange, Freinage, Moteur, Pneumatiques)")
  date: dt_date = Field(default_factory=dt_date.today, description="Date de réalisation de l'intervention")
  kilometrage: float = Field(..., ge=0.0, description="Kilométrage du véhicule au moment des travaux")
  probleme_constate: Optional[str] = Field(None, description="Anomalies signalées par le chauffeur ou chef de parc")
  diagnostic: Optional[str] = Field(None, description="Diagnostic technique atelier")
  travail_effectue: Optional[str] = Field(None, description="Opérations et réparations effectuées")
  est_externe: bool = Field(False, description="Intervention sous-traitée à un garage extérieur ?")
  prestataire_nom: Optional[str] = Field(None, description="Nom du garage ou concessionnaire externe")
  prestataire_telephone: Optional[str] = Field(None, description="Téléphone du prestataire externe")
  cout_total: float = Field(0.0, ge=0.0, description="Coût total de l'intervention (DZD)")
  prochaine_date_maintenance: Optional[dt_date] = Field(None, description="Échéance calendaire de la prochaine maintenance")
  prochain_kilo_maintenance: Optional[float] = Field(None, description="Kilométrage de la prochaine maintenance")
  statut: StatutIntervention = Field(StatutIntervention.TERMINEE, description="Statut de l'OT")


class InterventionCreate(InterventionBase):
  pieces_utilisees: List[PieceConsommeeItem] = Field(default=[], description="Liste des pièces détachées consommées depuis le stock")
  mecaniciens_participants_ids: List[UUID] = Field(default=[], description="Mécaniciens ayant participé aux travaux")


class InterventionUpdate(BaseModel):
  type: Optional[CategorieIntervention] = None
  categorie: Optional[str] = None
  date: Optional[dt_date] = None
  kilometrage: Optional[float] = None
  probleme_constate: Optional[str] = None
  diagnostic: Optional[str] = None
  travail_effectue: Optional[str] = None
  est_externe: Optional[bool] = None
  prestataire_nom: Optional[str] = None
  prestataire_telephone: Optional[str] = None
  cout_total: Optional[float] = None
  prochaine_date_maintenance: Optional[dt_date] = None
  prochain_kilo_maintenance: Optional[float] = None
  statut: Optional[StatutIntervention] = None


class InterventionRead(InterventionBase):
  id: UUID
  vehicule_immatriculation: Optional[str] = None
  vehicule_marque: Optional[str] = None
  vehicule_modele: Optional[str] = None
  mecanicien_nom_complet: Optional[str] = None
  created_at: datetime
  updated_at: datetime
  archived_at: Optional[datetime] = None

  model_config = ConfigDict(from_attributes=True)


class InterventionDetail(InterventionRead):
  pieces_consommees: List[PieceConsommeeItem] = []
  mecaniciens_participants: List[MecanicienParticipantItem] = []
  documents: List[DocumentSummary] = []
  total_pieces_utilisees: int = 0


class InterventionListResponse(BaseModel):
  items: List[InterventionRead]
  total: int
  page: int
  per_page: int
  total_pages: int
