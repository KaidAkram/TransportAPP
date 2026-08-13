from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin
from app.models.enums import RolePartenaire, TypePartenaire


class Partenaire(Base, BaseModelMixin):
    """
    Unified base partner entity for Clients and Suppliers.
    Prevents double-entry across contracts and financial bonds.
    """
    __tablename__ = "partenaires"

    nom_commercial = Column(String(200), nullable=False, index=True)
    logo = Column(String(255), nullable=True)
    nif = Column(String(50), nullable=True)
    nis = Column(String(50), nullable=True)
    registre_commerce = Column(String(50), nullable=True)
    article_imposition = Column(String(50), nullable=True)
    adresse = Column(String(255), nullable=True)
    wilaya = Column(String(100), nullable=True)
    commune = Column(String(100), nullable=True)
    code_postal = Column(String(20), nullable=True)
    telephone_principal = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    site_web = Column(String(150), nullable=True)
    statut_crm = Column(String(50), default="Actif", nullable=True)  # Actif, Prospect, Inactif, Bloqué

    role_partenaire = Column(
        SQLEnum(RolePartenaire, name="role_partenaire"),
        nullable=False,
        index=True,
    )

    # Client-specific attribute
    type_client = Column(
        SQLEnum(TypePartenaire, name="type_partenaire"),
        nullable=True,
    )

    # Fournisseur-specific attribute
    specialite = Column(String(150), nullable=True)

    __mapper_args__ = {
        "polymorphic_on": role_partenaire,
        "polymorphic_identity": RolePartenaire.PARTENAIRE_MIXTE,
    }

    contacts = relationship("Contact", back_populates="partenaire", cascade="all, delete-orphan")
    contrats = relationship("Contrat", back_populates="partenaire")
    crm_notes = relationship("CRMNote", back_populates="partenaire", cascade="all, delete-orphan")


class Client(Partenaire):
    __mapper_args__ = {
        "polymorphic_identity": RolePartenaire.CLIENT,
    }


class Fournisseur(Partenaire):
    __mapper_args__ = {
        "polymorphic_identity": RolePartenaire.FOURNISSEUR,
    }


class Contact(Base, BaseModelMixin):
    """
    Multi-contact registry associated with any Partner.
    """
    __tablename__ = "contacts"

    partenaire_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="CASCADE"), nullable=False)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    fonction = Column(String(100), nullable=True)
    telephone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    est_principal = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    partenaire = relationship("Partenaire", back_populates="contacts")


class CRMNote(Base, BaseModelMixin):
    """
    CRM interaction logging (Appel, Email, Réunion, Note) per Partner.
    """
    __tablename__ = "crm_notes"

    partenaire_id = Column(UUID(as_uuid=True), ForeignKey("partenaires.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), default="Note", nullable=False)  # Appel, Email, Réunion, Note
    auteur = Column(String(100), default="Administrateur", nullable=False)
    date = Column(Date, nullable=False)
    contenu = Column(Text, nullable=False)

    partenaire = relationship("Partenaire", back_populates="crm_notes")
