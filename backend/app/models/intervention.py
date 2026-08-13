from sqlalchemy import Column, String, Date, Float, Boolean, Text, Integer, Table, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin
from app.models.enums import CategorieIntervention, StatutIntervention

# Junction table: Intervention <-> Mecaniciens Participants
intervention_mecaniciens = Table(
    "intervention_mecaniciens",
    Base.metadata,
    Column("intervention_id", UUID(as_uuid=True), ForeignKey("interventions.id", ondelete="CASCADE"), primary_key=True),
    Column("mecanicien_id", UUID(as_uuid=True), ForeignKey("employes.id", ondelete="CASCADE"), primary_key=True),
)

# Junction table: Intervention <-> Pieces Detachees
intervention_pieces = Table(
    "intervention_pieces",
    Base.metadata,
    Column("intervention_id", UUID(as_uuid=True), ForeignKey("interventions.id", ondelete="CASCADE"), primary_key=True),
    Column("piece_id", UUID(as_uuid=True), ForeignKey("pieces.id", ondelete="CASCADE"), primary_key=True),
    Column("quantite_utilisee", Integer, default=1, nullable=False),
)


class Intervention(Base, BaseModelMixin):
    """
    Maintenance work order / technical intervention on a fleet vehicle.
    """
    __tablename__ = "interventions"

    numero = Column(String(50), unique=True, nullable=False, index=True)  # e.g., INT-2026-00125
    vehicule_id = Column(UUID(as_uuid=True), ForeignKey("vehicules.id", ondelete="RESTRICT"), nullable=False)
    mecanicien_responsable_id = Column(UUID(as_uuid=True), ForeignKey("employes.id", ondelete="RESTRICT"), nullable=True)

    type = Column(
        SQLEnum(CategorieIntervention, name="categorie_intervention"),
        default=CategorieIntervention.PREVENTIVE,
        nullable=False,
    )
    categorie = Column(String(100), nullable=False)  # Vidange, Freinage, Révision générale, Moteur, etc.
    date = Column(Date, nullable=False)
    kilometrage = Column(Float, nullable=False)

    probleme_constate = Column(Text, nullable=True)
    diagnostic = Column(Text, nullable=True)
    travail_effectue = Column(Text, nullable=True)

    est_externe = Column(Boolean, default=False, nullable=False)
    prestataire_nom = Column(String(150), nullable=True)
    prestataire_telephone = Column(String(50), nullable=True)

    cout_total = Column(Float, default=0.0, nullable=False)

    prochaine_date_maintenance = Column(Date, nullable=True)
    prochain_kilo_maintenance = Column(Float, nullable=True)

    statut = Column(
        SQLEnum(StatutIntervention, name="statut_intervention"),
        default=StatutIntervention.TERMINEE,
        nullable=False,
    )

    vehicule = relationship("Vehicule", back_populates="interventions")
    mecanicien_responsable = relationship("Employe", foreign_keys=[mecanicien_responsable_id])
    mecaniciens_participants = relationship("Employe", secondary=intervention_mecaniciens)
    pieces_utilisees = relationship("Piece", secondary=intervention_pieces)
    mouvements_stock = relationship("MouvementStock", back_populates="intervention")
