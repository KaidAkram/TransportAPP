from sqlalchemy import Column, String, Date
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, BaseModelMixin


class Document(Base, BaseModelMixin):
    """
    Universal document record used across vehicles, drivers, contracts, cautions, and interventions.
    """
    __tablename__ = "documents"

    nom = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # Assurance, Carte Grise, Permis, Contrat, Facture, Main Levée, etc.
    url_fichier = Column(String(500), nullable=False)
    date_emission = Column(Date, nullable=True)
    date_expiration = Column(Date, nullable=True)
    statut_validite = Column(String(50), nullable=True)  # Valide, Expire bientôt, Expiré

    # Universal entity attachment
    entity_type = Column(String(50), nullable=False, index=True)  # vehicule, employe, contrat, caution, etc.
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
