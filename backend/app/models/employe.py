from sqlalchemy import Column, String, Date, Boolean, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin
from app.models.enums import StatutEmploye, TypeEmploye


class Employe(Base, BaseModelMixin):
    """
    Base employee table using Single Table Inheritance for Chauffeur and Mecanicien.
    """
    __tablename__ = "employes"

    matricule = Column(String(50), unique=True, nullable=False, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    photo = Column(String(500), nullable=True)
    date_naissance = Column(Date, nullable=True)
    telephone = Column(String(50), nullable=True)
    adresse = Column(String(255), nullable=True)
    date_embauche = Column(Date, nullable=True)
    statut = Column(
        SQLEnum(StatutEmploye, name="statut_employe"),
        default=StatutEmploye.ACTIF,
        nullable=False,
    )
    type_employe = Column(
        SQLEnum(TypeEmploye, name="type_employe"),
        nullable=False,
        index=True,
    )

    # Chauffeur-specific attributes
    fonction = Column(String(100), nullable=True)
    assurance = Column(Boolean, default=True, nullable=True)

    # Mecanicien-specific attributes
    specialite = Column(String(100), nullable=True)
    type_mecanicien = Column(String(100), nullable=True)
    experience = Column(String(50), nullable=True)
    est_responsable = Column(Boolean, default=False, nullable=True)

    __mapper_args__ = {
        "polymorphic_on": type_employe,
        "polymorphic_identity": TypeEmploye.ADMINISTRATIF,
    }


class Chauffeur(Employe):
    __mapper_args__ = {
        "polymorphic_identity": TypeEmploye.CHAUFFEUR,
    }

    permis = relationship("Permis", back_populates="chauffeur", uselist=False, cascade="all, delete-orphan")


class Mecanicien(Employe):
    __mapper_args__ = {
        "polymorphic_identity": TypeEmploye.MECANICIEN,
    }


class Permis(Base, BaseModelMixin):
    """
    Driver's license associated 1:1 with a Chauffeur.
    """
    __tablename__ = "permis"

    chauffeur_id = Column(UUID(as_uuid=True), ForeignKey("employes.id", ondelete="CASCADE"), unique=True, nullable=False)
    numero = Column(String(50), unique=True, nullable=False, index=True)
    categories = Column(String(100), nullable=False)  # Comma-separated categories e.g. "B, D, D1"
    date_obtention = Column(Date, nullable=True)
    date_expiration = Column(Date, nullable=True)
    scan_permis = Column(String(500), nullable=True)

    chauffeur = relationship("Chauffeur", back_populates="permis")
