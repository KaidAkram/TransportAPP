from sqlalchemy import Column, String, Boolean
from app.models.base import Base, BaseModelMixin


class FeatureToggle(Base, BaseModelMixin):
  """
  Admin-controlled feature toggle table for dynamic permission management.
  Restricts or enables specific functional actions for the Gestionnaire role.
  """
  __tablename__ = "feature_toggles"

  feature_name = Column(String(100), unique=True, nullable=False, index=True)
  description = Column(String(255), nullable=False)
  categorie = Column(String(50), nullable=False, index=True)
  enabled_for_gestionnaire = Column(Boolean, default=True, nullable=False)
