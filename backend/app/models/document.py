from datetime import datetime, timezone
from sqlalchemy import Column, String, Date, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, BaseModelMixin


class Document(Base, BaseModelMixin):
  """
  Universal polymorphic document record used across vehicles, drivers, partners,
  contracts, cautions, work orders, missions, and financial documents.
  """
  __tablename__ = "documents"

  nom = Column(String(255), nullable=False)
  type = Column(String(100), nullable=True) # Legacy type alias
  document_type = Column(String(100), nullable=False, default="Autre") # Photo, Assurance, Carte Grise, Permis, etc.
  filename = Column(String(255), nullable=True)
  file_path = Column(String(500), nullable=True)
  url_fichier = Column(String(500), nullable=False)
  mime_type = Column(String(100), nullable=True, default="application/pdf")
  size = Column(Integer, nullable=True, default=0) # File size in bytes
  uploaded_by = Column(String(100), nullable=True, default="admin")
  uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
  description = Column(Text, nullable=True)

  # Expiration & validity tracking
  date_emission = Column(Date, nullable=True)
  date_expiration = Column(Date, nullable=True)
  statut_validite = Column(String(50), nullable=True, default="Valide") # Valide, Expire bientôt, Expiré

  # Universal polymorphic entity attachment
  entity_type = Column(String(50), nullable=False, index=True) # vehicule, employe, partenaire, contrat, caution, intervention, mission, devis, facture
  entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
