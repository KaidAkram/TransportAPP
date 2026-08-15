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
  StatutDevis,
  StatutFacture,
  ModePaiement,
  StatutPaiement,
  CategorieDepenseVehicule,
)


class Devis(Base, BaseModelMixin):
  __tablename__ = "devis"

  numero = Column(String(50), unique=True, nullable=False, index=True)
  client_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="RESTRICT"), nullable=False)
  contrat_id = Column(UUID(as_uuid=True), ForeignKey("contrats.id", ondelete="SET NULL"), nullable=True)

  date_emission = Column(Date, nullable=False, default=date.today)
  date_validite = Column(Date, nullable=False)
  statut = Column(Enum(StatutDevis), default=StatutDevis.BROUILLON, nullable=False)

  objet = Column(String(255), nullable=False)
  conditions_reglement = Column(Text, nullable=True)

  total_ht = Column(Float, default=0.0, nullable=False)
  taux_tva = Column(Float, default=19.0, nullable=False)
  montant_tva = Column(Float, default=0.0, nullable=False)
  total_ttc = Column(Float, default=0.0, nullable=False)

  url_pdf = Column(String(500), nullable=True)

  # Relationships
  client = relationship("Partenaire", foreign_keys=[client_id], backref="devis_emis")
  contrat = relationship("Contrat", foreign_keys=[contrat_id], backref="devis_origine")
  lignes = relationship("DevisLigne", back_populates="devis", cascade="all, delete-orphan", lazy="selectin")


class DevisLigne(Base, BaseModelMixin):
  __tablename__ = "devis_lignes"

  devis_id = Column(UUID(as_uuid=True), ForeignKey("devis.id", ondelete="CASCADE"), nullable=False)

  service = Column(String(100), nullable=False)
  description = Column(Text, nullable=False)
  quantite = Column(Float, default=1.0, nullable=False)
  prix_unitaire = Column(Float, default=0.0, nullable=False)
  total_ligne = Column(Float, default=0.0, nullable=False)

  devis = relationship("Devis", back_populates="lignes")


class Facture(Base, BaseModelMixin):
  __tablename__ = "factures"

  numero = Column(String(50), unique=True, nullable=False, index=True)
  client_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="RESTRICT"), nullable=False)
  contrat_id = Column(UUID(as_uuid=True), ForeignKey("contrats.id", ondelete="SET NULL"), nullable=True)
  devis_id = Column(UUID(as_uuid=True), ForeignKey("devis.id", ondelete="SET NULL"), nullable=True)

  date_emission = Column(Date, nullable=False, default=date.today)
  date_echeance = Column(Date, nullable=False)
  statut = Column(Enum(StatutFacture), default=StatutFacture.EN_ATTENTE, nullable=False)
  mode_reglement = Column(Enum(ModePaiement), default=ModePaiement.VIREMENT, nullable=False)

  total_ht = Column(Float, default=0.0, nullable=False)
  taux_tva = Column(Float, default=19.0, nullable=False)
  montant_tva = Column(Float, default=0.0, nullable=False)
  total_ttc = Column(Float, default=0.0, nullable=False)

  montant_paye = Column(Float, default=0.0, nullable=False)
  montant_restant = Column(Float, default=0.0, nullable=False)

  notes = Column(Text, nullable=True)
  url_pdf = Column(String(500), nullable=True)

  # Relationships
  client = relationship("Partenaire", foreign_keys=[client_id], backref="factures_recues")
  contrat = relationship("Contrat", foreign_keys=[contrat_id], backref="factures_contrat")
  devis = relationship("Devis", foreign_keys=[devis_id], backref="factures_devis")
  lignes = relationship("FactureLigne", back_populates="facture", cascade="all, delete-orphan", lazy="selectin")
  paiements = relationship("Paiement", back_populates="facture", cascade="all, delete-orphan", lazy="selectin")


class FactureLigne(Base, BaseModelMixin):
  __tablename__ = "facture_lignes"

  facture_id = Column(UUID(as_uuid=True), ForeignKey("factures.id", ondelete="CASCADE"), nullable=False)

  service = Column(String(100), nullable=False)
  description = Column(Text, nullable=False)
  quantite = Column(Float, default=1.0, nullable=False)
  prix_unitaire = Column(Float, default=0.0, nullable=False)
  total_ligne = Column(Float, default=0.0, nullable=False)

  facture = relationship("Facture", back_populates="lignes")


class Paiement(Base, BaseModelMixin):
  __tablename__ = "paiements"

  facture_id = Column(UUID(as_uuid=True), ForeignKey("factures.id", ondelete="CASCADE"), nullable=False)

  date = Column(Date, nullable=False, default=date.today)
  montant = Column(Float, nullable=False)
  mode = Column(Enum(ModePaiement), default=ModePaiement.VIREMENT, nullable=False)
  reference = Column(String(100), nullable=False)
  banque = Column(String(100), nullable=True)
  statut = Column(Enum(StatutPaiement), default=StatutPaiement.VALIDE, nullable=False)
  notes = Column(Text, nullable=True)

  facture = relationship("Facture", back_populates="paiements")


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
