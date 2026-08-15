from sqlalchemy import Column, String, Integer, Date, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin
from app.models.enums import TypeMouvement


class Piece(Base, BaseModelMixin):
  """
  Spare part and inventory entity. Stock level is computed from stock movements.
  """
  __tablename__ = "pieces"

  reference = Column(String(50), unique=True, nullable=False, index=True) # e.g., FIL-001
  designation = Column(String(200), nullable=False)
  categorie = Column(String(100), nullable=False, index=True) # Filtres, Freinage, etc.
  marque = Column(String(100), nullable=True)
  modele_compatibilite = Column(String(255), nullable=True)
  unite = Column(String(20), default="Pièce", nullable=False)
  stock_actuel = Column(Integer, default=0, nullable=False)
  stock_minimum = Column(Integer, default=5, nullable=False)
  emplacement = Column(String(50), nullable=True) # e.g., Rayon A - Etagère 03 ->A-03-02
  description = Column(Text, nullable=True)

  mouvements = relationship("MouvementStock", back_populates="piece", cascade="all, delete-orphan")


class MouvementStock(Base, BaseModelMixin):
  """
  Immutable stock movement ledger (Entrée, Sortie, Inventaire).
  """
  __tablename__ = "mouvements_stock"

  piece_id = Column(UUID(as_uuid=True), ForeignKey("pieces.id", ondelete="RESTRICT"), nullable=False)
  type = Column(
    SQLEnum(TypeMouvement, name="type_mouvement"),
    nullable=False,
  )
  quantite = Column(Integer, nullable=False)
  date = Column(Date, nullable=False)
  motif = Column(String(200), nullable=False) # Intervention, Achat, Perte, Ajustement inventaire
  ecart_inventaire = Column(Integer, nullable=True)

  # Optional cross-module links
  intervention_id = Column(UUID(as_uuid=True), ForeignKey("interventions.id", ondelete="SET NULL"), nullable=True)
  fournisseur_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="SET NULL"), nullable=True)
  reference_document = Column(String(100), nullable=True) # Bon de livraison, Bon de sortie

  piece = relationship("Piece", back_populates="mouvements")
  intervention = relationship("Intervention", back_populates="mouvements_stock")
  fournisseur = relationship("Partenaire")
