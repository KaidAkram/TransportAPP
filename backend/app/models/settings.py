from sqlalchemy import Column, String
from app.models.base import Base, BaseModelMixin

class SystemSettings(Base, BaseModelMixin):
  """
  Global system settings, such as theme, typography, and company information.
  Only one row should ever exist in this table (singleton).
  """
  __tablename__ = "system_settings"

  # We use a fixed ID for the singleton row
  singleton_id = Column(String(50), unique=True, nullable=False, default="global", index=True)
  
  theme = Column(String(50), default="quantum", nullable=False)
  typography = Column(String(50), default="quantum-tech", nullable=False)
  
  # Company Info
  company_name = Column(String(255), default="Flō")
  company_address = Column(String(255), default="123 Route Nationale, Alger")
  company_rc = Column(String(100), default="1234567890")
  company_nif = Column(String(100), default="0987654321")
  company_nis = Column(String(100), default="1122334455")
  company_ai = Column(String(100), default="9988776655")
  company_phone = Column(String(100), default="+213 555 123 456")
  company_logo_base64 = Column(String, nullable=True)
