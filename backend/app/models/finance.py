from datetime import date
from sqlalchemy import (
  Column,
  String,
  Float,
  Date,
  Enum,
  ForeignKey,
  Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin
from app.models.enums import (
  StatutFacture,
  ModePaiement,
  CategorieDepenseVehicule,
)


class Facture(Base, BaseModelMixin):
  __tablename__ = "factures"

  numero = Column(String(50), unique=True, nullable=False, index=True)
  client_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="RESTRICT"), nullable=False)

  date_facture = Column(Date, nullable=False, default=date.today)
  mois_realisation = Column(String(20), nullable=False)
  montant_facture = Column(Float, default=0.0, nullable=False)
  statut = Column(Enum(StatutFacture), default=StatutFacture.EN_ATTENTE, nullable=False)
  remarques = Column(Text, nullable=True)

  mode_reglement = Column(Enum(ModePaiement), nullable=True)
  date_reglement = Column(Date, nullable=True)
  url_document_reglement = Column(String(500), nullable=True)

  client = relationship("Partenaire", foreign_keys=[client_id], backref="factures_recues")


class DepenseVehicule(Base, BaseModelMixin):
  __tablename__ = "depenses_vehicules"

  vehicule_id = Column(UUID(as_uuid=True), ForeignKey("vehicules.id", ondelete="CASCADE"), nullable=False)

  categorie = Column(Enum(CategorieDepenseVehicule), nullable=False)
  date = Column(Date, nullable=False, default=date.today)
  montant = Column(Float, nullable=False)
  kilometrage = Column(Float, nullable=True)
  fournisseur = Column(String(150), nullable=True)
  justificatif = Column(String(500), nullable=True)
  notes = Column(Text, nullable=True)

  vehicule = relationship("Vehicule", backref="depenses_detaillees")
