from uuid import UUID
from typing import List, Dict
from pydantic import BaseModel, ConfigDict


class FeatureToggleBase(BaseModel):
  feature_name: str
  description: str
  categorie: str
  enabled_for_gestionnaire: bool = True


class FeatureToggleUpdate(BaseModel):
  enabled_for_gestionnaire: bool


class FeatureToggleRead(FeatureToggleBase):
  id: UUID
  model_config = ConfigDict(from_attributes=True)


class FeatureToggleListResponse(BaseModel):
  items: List[FeatureToggleRead]
  total: int


class FeatureToggleMapResponse(BaseModel):
  features: Dict[str, bool]
  role: str
