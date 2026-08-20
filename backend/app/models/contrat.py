from sqlalchemy import Column, String, Date, Float, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin
from app.models.enums import StatutContrat, TypeCaution, StatutCaution


class Contrat(Base, BaseModelMixin):
  """
  Contract record binding the enterprise to clients or suppliers.
  """
  __tablename__ = "contrats"

  reference = Column(String(50), unique=True, nullable=False, index=True) # e.g., CTR-2026-001
  partenaire_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="RESTRICT"), nullable=False)
  objet = Column(Text, nullable=False)
  type_contrat = Column(String(100), default="Transport", nullable=False) # Transport, Maintenance, Fourniture, etc.
  date_debut = Column(Date, nullable=False)
  date_fin = Column(Date, nullable=True)
  montant = Column(Float, default=0.0, nullable=False)
  devise = Column(String(10), default="DZD", nullable=False)
  mode_facturation = Column(String(100), nullable=True)
  conditions_paiement = Column(String(200), nullable=True)
  statut = Column(
    SQLEnum(StatutContrat, name="statut_contrat"),
    default=StatutContrat.ACTIF,
    nullable=False,
  )

  partenaire = relationship("Partenaire", back_populates="contrats")
  avenants = relationship("Avenant", back_populates="contrat", cascade="all, delete-orphan")
  cautions = relationship("Caution", back_populates="contrat")


class Avenant(Base, BaseModelMixin):
  """
  Contract amendments modifying terms, dates, or financial amounts.
  """
  __tablename__ = "avenants"

  contrat_id = Column(UUID(as_uuid=True), ForeignKey("contrats.id", ondelete="CASCADE"), nullable=False)
  numero = Column(String(50), nullable=False) # e.g., Avenant N°01
  date = Column(Date, nullable=False)
  objet = Column(String(255), nullable=False)
  description = Column(Text, nullable=True)
  modif_montant = Column(Float, nullable=True)
  nouvelle_date_fin = Column(Date, nullable=True)

  contrat = relationship("Contrat", back_populates="avenants")


class Caution(Base, BaseModelMixin):
  """
  Financial guarantees and bonds (Tender / Performance bonds) with lifecycle tracking and PDF generation.
  """
  __tablename__ = "cautions"

  numero = Column(String(50), unique=True, nullable=False, index=True) # e.g., CAU-2026-001
  type = Column(
    SQLEnum(TypeCaution, name="type_caution"),
    nullable=False,
  )
  client_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="RESTRICT"), nullable=False)
  contrat_id = Column(UUID(as_uuid=True), ForeignKey("contrats.id", ondelete="SET NULL"), nullable=True)
  montant = Column(Float, nullable=False)
  devise = Column(String(10), default="DZD", nullable=False)
  reference_type = Column(String(50), default="Contrat", nullable=False) # Contrat, Appel d'offre
  reference_numero = Column(String(100), nullable=False)
  objet = Column(Text, nullable=False)
  date_emission = Column(Date, nullable=False)
  date_echeance = Column(Date, nullable=True)
  date_retour = Column(Date, nullable=True)
  statut = Column(
    SQLEnum(StatutCaution, name="statut_caution"),
    default=StatutCaution.CREATION,
    nullable=False,
  )
  banque_emetteur = Column(String(150), default="Banque Nationale d'Algérie (BNA)", nullable=True)
  lieu_demande = Column(String(200), nullable=True)
  lieu_soumission = Column(String(200), nullable=True)
  numero_compte_bancaire = Column(String(100), nullable=True)
  societe_nom = Column(String(200), nullable=True)
  client_societe_nom = Column(String(200), nullable=True)
  url_caution_pdf = Column(String(500), nullable=True)
  url_main_levee_pdf = Column(String(500), nullable=True)

  client = relationship("Partenaire", foreign_keys=[client_id])
  contrat = relationship("Contrat", back_populates="cautions")
