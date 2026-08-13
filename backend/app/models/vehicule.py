from sqlalchemy import Column, String, Integer, Date, Float, Boolean, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin
from app.models.enums import StatutVehicule


class Vehicule(Base, BaseModelMixin):
    """
    Fleet vehicle master record.
    """
    __tablename__ = "vehicules"

    immatriculation = Column(String(50), unique=True, nullable=False, index=True)  # e.g., 16-123456-00
    marque = Column(String(100), nullable=False)
    modele = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # Bus, Minibus, Voiture, Van, Autre
    nombre_places = Column(Integer, default=1, nullable=False)
    annee = Column(Integer, nullable=True)
    date_mise_circulation = Column(Date, nullable=True)
    kilometrage_actuel = Column(Float, default=0.0, nullable=False)
    statut = Column(
        SQLEnum(StatutVehicule, name="statut_vehicule"),
        default=StatutVehicule.DISPONIBLE,
        nullable=False,
    )
    cout_total = Column(Float, default=0.0, nullable=False)

    constats = relationship("Constat", back_populates="vehicule", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="vehicule")


class Constat(Base, BaseModelMixin):
    """
    Accident/incident report tied to a vehicle and driver.
    """
    __tablename__ = "constats"

    vehicule_id = Column(UUID(as_uuid=True), ForeignKey("vehicules.id", ondelete="CASCADE"), nullable=False)
    chauffeur_id = Column(UUID(as_uuid=True), ForeignKey("employes.id", ondelete="SET NULL"), nullable=True)
    date = Column(Date, nullable=False)
    heure = Column(String(20), nullable=True)
    lieu = Column(String(255), nullable=False)
    circonstances = Column(Text, nullable=False)
    dommages = Column(Text, nullable=False)
    tiers_implique = Column(Boolean, default=False, nullable=False)
    infos_tiers = Column(Text, nullable=True)

    vehicule = relationship("Vehicule", back_populates="constats")
    chauffeur = relationship("Employe", foreign_keys=[chauffeur_id])
