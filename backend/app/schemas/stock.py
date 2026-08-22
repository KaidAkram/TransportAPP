from datetime import date as dt_date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import TypeMouvement, ModeReglementReception


# ----------------------------------------------------
# Mouvement de Stock Schemas
# ----------------------------------------------------
class MouvementStockBase(BaseModel):
  piece_id: UUID = Field(..., description="ID de la pièce concernée")
  type: TypeMouvement = Field(..., description="Type de mouvement (ENTREE, SORTIE, INVENTAIRE)")
  quantite: int = Field(..., description="Quantité déplacée")
  date: dt_date = Field(..., description="Date du mouvement")
  motif: str = Field(..., description="Motif (ex: Achat, Intervention, Inventaire)")
  ecart_inventaire: Optional[int] = Field(None, description="Écart constaté lors d'un inventaire")
  intervention_id: Optional[UUID] = Field(None, description="ID de l'intervention si sortie atelier")
  fournisseur_id: Optional[UUID] = Field(None, description="ID du fournisseur si entrée magasin")
  reference_document: Optional[str] = Field(None, description="N° Bon de Livraison ou Bon de Sortie")


class MouvementStockCreate(MouvementStockBase):
  pass


class MouvementStockRead(MouvementStockBase):
  id: UUID
  piece_reference: Optional[str] = None
  piece_designation: Optional[str] = None
  fournisseur_nom: Optional[str] = None
  intervention_numero: Optional[str] = None
  created_at: datetime
  updated_at: datetime

  model_config = ConfigDict(from_attributes=True)


class MouvementStockListResponse(BaseModel):
  items: List[MouvementStockRead]
  total: int
  page: int
  per_page: int
  total_pages: int


# ----------------------------------------------------
# Specific Stock Action Schemas
# ----------------------------------------------------
class StockEntryCreate(BaseModel):
  piece_id: UUID = Field(..., description="ID de la pièce à réceptionner")
  quantite: int = Field(..., gt=0, description="Quantité livrée (>0)")
  fournisseur_id: Optional[UUID] = Field(None, description="Fournisseur ayant livré la pièce")
  date: dt_date = Field(default_factory=dt_date.today, description="Date de réception")
  motif: str = Field("Réception commande magasin", description="Motif de l'entrée")
  reference_document: Optional[str] = Field(None, description="N° Bon de Livraison (BL)")


class StockExitCreate(BaseModel):
  piece_id: UUID = Field(..., description="ID de la pièce à sortir du stock")
  quantite: int = Field(..., gt=0, description="Quantité à consommer (>0)")
  intervention_id: Optional[UUID] = Field(None, description="Intervention atelier rattachée")
  date: dt_date = Field(default_factory=dt_date.today, description="Date de la sortie")
  motif: str = Field("Consommation atelier", description="Motif de la sortie")
  reference_document: Optional[str] = Field(None, description="N° Bon de Sortie (BS)")


class InventoryAuditCreate(BaseModel):
  piece_id: UUID = Field(..., description="ID de la pièce auditée")
  stock_reel_compte: int = Field(..., ge=0, description="Stock physique réel compté")
  date: dt_date = Field(default_factory=dt_date.today, description="Date du comptage physique")
  motif: str = Field("Régularisation inventaire physique", description="Motif de l'ajustement")
  justification_ecart: Optional[str] = Field(None, description="Explication (Perte, Casse, Erreur saisie)")


# ----------------------------------------------------
# Pièce Détachée Schemas
# ----------------------------------------------------
class PieceBase(BaseModel):
  reference: str = Field(..., description="Référence magasin unique (ex: FIL-001)")
  designation: str = Field(..., description="Désignation complète de la pièce")
  categorie: str = Field(..., description="Catégorie (Filtres, Freinage, Moteur, Électricité, Pneumatiques, etc.)")
  marque: Optional[str] = Field(None, description="Marque du fabricant (ex: Mann-Filter, Knorr-Bremse)")
  modele_compatibilite: Optional[str] = Field(None, description="Véhicules et modèles compatibles")
  unite: str = Field("Pièce", description="Unité de mesure (Pièce, Jeu, Litre, Kit)")
  stock_actuel: int = Field(0, ge=0, description="Niveau de stock disponible")
  stock_minimum: int = Field(5, ge=0, description="Seuil d'alerte de réapprovisionnement")
  emplacement: Optional[str] = Field(None, description="Emplacement physique (ex: A-03-02)")
  description: Optional[str] = Field(None, description="Description technique / spécifications")


class PieceCreate(PieceBase):
  pass


class PieceUpdate(BaseModel):
  designation: Optional[str] = None
  categorie: Optional[str] = None
  marque: Optional[str] = None
  modele_compatibilite: Optional[str] = None
  unite: Optional[str] = None
  stock_minimum: Optional[int] = Field(None, ge=0)
  emplacement: Optional[str] = None
  description: Optional[str] = None


class PieceRead(PieceBase):
  id: UUID
  statut_stock: str = "NORMAL"# NORMAL, FAIBLE, RUPTURE
  created_at: datetime
  updated_at: datetime
  archived_at: Optional[datetime] = None

  model_config = ConfigDict(from_attributes=True)


class PieceDetail(PieceRead):
  mouvements: List[MouvementStockRead] = []
  total_entrees: int = 0
  total_sorties: int = 0


class PieceListResponse(BaseModel):
  items: List[PieceRead]
  total: int
  page: int
  per_page: int
  total_pages: int
  total_references: int = 0
  total_stock_normal: int = 0
  total_stock_faible: int = 0
  total_rupture: int = 0


# ----------------------------------------------------
# Reception Schemas
# ----------------------------------------------------
class ReceptionLigneCreate(BaseModel):
  piece_id: UUID = Field(..., description="ID de la pièce")
  quantite: int = Field(..., gt=0, description="Quantité reçue (>0)")
  prix_unitaire: float = Field(..., gt=0, description="Prix unitaire d'achat")


class ReceptionLigneRead(BaseModel):
  id: UUID
  piece_id: UUID
  piece_reference: Optional[str] = None
  piece_designation: Optional[str] = None
  quantite: int
  prix_unitaire: float
  montant_ligne: float

  model_config = ConfigDict(from_attributes=True)


class ReceptionCreate(BaseModel):
  numero: Optional[str] = Field(None, description="Numéro (généré automatiquement si non fourni)")
  fournisseur_id: Optional[UUID] = Field(None, description="Fournisseur ayant livré")
  date: dt_date = Field(default_factory=dt_date.today, description="Date de réception")
  lieu: Optional[str] = Field(None, description="Lieu de réception")
  mode_reglement: ModeReglementReception = Field(..., description="Mode de règlement")
  motif: Optional[str] = Field(None, description="Motif / remarque")
  reference_document: Optional[str] = Field(None, description="N° Bon de Livraison (BL)")
  lignes: List[ReceptionLigneCreate] = Field(..., min_length=1, description="Articles reçus")


class ReceptionRead(BaseModel):
  id: UUID
  numero: str
  fournisseur_id: Optional[UUID] = None
  fournisseur_nom: Optional[str] = None
  date: dt_date
  lieu: Optional[str] = None
  montant_total: float
  mode_reglement: ModeReglementReception
  motif: Optional[str] = None
  reference_document: Optional[str] = None
  url_pdf: Optional[str] = None
  created_at: datetime
  updated_at: datetime

  model_config = ConfigDict(from_attributes=True)


class ReceptionDetail(ReceptionRead):
  lignes: List[ReceptionLigneRead] = []


class ReceptionListResponse(BaseModel):
  items: List[ReceptionRead]
  total: int
  page: int
  per_page: int
  total_pages: int
