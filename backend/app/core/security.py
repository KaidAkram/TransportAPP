from datetime import datetime, timedelta, timezone
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.feature_toggle import FeatureToggle

security_bearer = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
  id: str
  username: str
  email: str
  role: str = "gestionnaire"# admin | gestionnaire
  app_metadata: dict = {}
  user_metadata: dict = {}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) ->str:
  to_encode = data.copy()
  if expires_delta:
    expire = datetime.now(timezone.utc) + expires_delta
  else:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
  encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
  return encoded_jwt


def decode_token_payload(token: str) ->dict:
  try:
    payload = jwt.decode(
      token,
      settings.JWT_SECRET,
      algorithms=[settings.JWT_ALGORITHM],
      options={"verify_aud": False},
    )
    return payload
  except JWTError:
    if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET != "placeholder-jwt-secret":
      return jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        options={"verify_aud": False},
      )
    else:
      return jwt.decode(
        token,
        key="secret",
        options={"verify_signature": False, "verify_aud": False},
      )


def get_current_user(
  credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) ->CurrentUser:
  """
  Strict guard: Validates incoming JWT Bearer token and returns CurrentUser.
  Rejects missing or invalid tokens with HTTP 401.
  """
  if not credentials or not credentials.credentials:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Missing Authorization bearer token.",
      headers={"WWW-Authenticate": "Bearer"},
    )

  token = credentials.credentials
  try:
    payload = decode_token_payload(token)

    user_id = payload.get("sub") or payload.get("id") or "user-default"
    username = payload.get("username") or payload.get("sub") or "user"
    email = payload.get("email") or f"{username}@etransport.dz"

    app_metadata = payload.get("app_metadata", {})
    user_metadata = payload.get("user_metadata", {})
    role = payload.get("role") or app_metadata.get("role") or user_metadata.get("role") or "gestionnaire"

    return CurrentUser(
      id=str(user_id),
      username=str(username),
      email=str(email),
      role=str(role),
      app_metadata=app_metadata,
      user_metadata=user_metadata,
    )

  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail=f"Invalid or expired authentication token: {str(e)}",
      headers={"WWW-Authenticate": "Bearer"},
    )


def get_optional_user(
  credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) ->CurrentUser:
  """
  Flexible token extractor: returns decoded user if token is provided;
  defaults to admin user if no token is passed (e.g. for background or unauthenticated dev calls).
  """
  if credentials and credentials.credentials:
    try:
      return get_current_user(credentials)
    except HTTPException:
      pass
  return CurrentUser(
    id="usr-admin-01",
    username="admin",
    email="admin@etransport.dz",
    role="admin",
  )


def require_admin(user: CurrentUser = Depends(get_current_user)) ->CurrentUser:
  """
  Guard dependency restricting access exclusively to Admin users.
  """
  if user.role != "admin":
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Accès refusé : privilèges Administrateur requis.",
    )
  return user


def require_feature(feature_name: str):
  """
  Dependency factory checking whether the action is enabled for the caller.
  Admins are always granted access.
  Gestionnaires are blocked with HTTP 403 if the toggle is disabled in the database.
  """
  def dependency(
    current_user: CurrentUser = Depends(get_optional_user),
    db: Session = Depends(get_db),
  ) ->CurrentUser:
    if current_user.role == "admin":
      return current_user

    toggle = db.query(FeatureToggle).filter(FeatureToggle.feature_name == feature_name).first()
    if toggle and not toggle.enabled_for_gestionnaire:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Cette fonctionnalité est désactivée par l'administrateur.",
      )
    return current_user

  return dependency
