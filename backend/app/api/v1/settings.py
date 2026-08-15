from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user, require_admin, CurrentUser
from app.models.settings import SystemSettings

router = APIRouter(prefix="/settings", tags=["System Settings"])

class CompanySettingsModel(BaseModel):
  name: str
  address: str
  logoBase64: str | None = None
  rc: str
  nif: str
  nis: str
  ai: str
  phone: str

class SystemSettingsUpdate(BaseModel):
  theme: str
  typography: str
  company: CompanySettingsModel

class SystemSettingsResponse(SystemSettingsUpdate):
  pass

def get_or_create_settings(db: Session) -> SystemSettings:
  settings = db.query(SystemSettings).filter(SystemSettings.singleton_id == "global").first()
  if not settings:
    settings = SystemSettings(singleton_id="global")
    db.add(settings)
    db.commit()
    db.refresh(settings)
  return settings

@router.get("/global", response_model=SystemSettingsResponse, summary="Get global system settings")
def get_global_settings(db: Session = Depends(get_db)):
  settings = get_or_create_settings(db)
  return SystemSettingsResponse(
    theme=settings.theme,
    typography=settings.typography,
    company=CompanySettingsModel(
      name=settings.company_name,
      address=settings.company_address,
      logoBase64=settings.company_logo_base64,
      rc=settings.company_rc,
      nif=settings.company_nif,
      nis=settings.company_nis,
      ai=settings.company_ai,
      phone=settings.company_phone,
    )
  )

@router.put("/global", response_model=SystemSettingsResponse, summary="Update global system settings (Admin Only)")
def update_global_settings(
  payload: SystemSettingsUpdate,
  admin_user: CurrentUser = Depends(require_admin),
  db: Session = Depends(get_db)
):
  settings = get_or_create_settings(db)
  
  settings.theme = payload.theme
  settings.typography = payload.typography
  
  settings.company_name = payload.company.name
  settings.company_address = payload.company.address
  settings.company_logo_base64 = payload.company.logoBase64
  settings.company_rc = payload.company.rc
  settings.company_nif = payload.company.nif
  settings.company_nis = payload.company.nis
  settings.company_ai = payload.company.ai
  settings.company_phone = payload.company.phone
  
  db.commit()
  db.refresh(settings)
  
  return SystemSettingsResponse(
    theme=settings.theme,
    typography=settings.typography,
    company=CompanySettingsModel(
      name=settings.company_name,
      address=settings.company_address,
      logoBase64=settings.company_logo_base64,
      rc=settings.company_rc,
      nif=settings.company_nif,
      nis=settings.company_nis,
      ai=settings.company_ai,
      phone=settings.company_phone,
    )
  )
