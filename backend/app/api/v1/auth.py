import time
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt

from app.core.config import settings
from app.core.security import get_current_user, require_admin, CurrentUser, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])


class LoginRequest(BaseModel):
  username: str
  password: str


class LoginResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  user: dict


@router.post("/login", response_model=LoginResponse, summary="User Authentication (Admin / Gestionnaire)")
def login(payload: LoginRequest):
  """
  Authenticates hardcoded users:
  - admin / 123 (Role: admin)
  - gestionnaire / 123 (Role: gestionnaire)
  """
  username = payload.username.strip().lower()
  password = payload.password.strip()

  if username == "admin"and password == "123":
    role = "admin"
    user_id = "usr-admin-01"
    email = "admin@etransport.dz"
    full_name = "Directeur Général (Admin)"
  elif username == "gestionnaire"and password == "123":
    role = "gestionnaire"
    user_id = "usr-gest-01"
    email = "gestionnaire@etransport.dz"
    full_name = "Chef d'Exploitation (Gestionnaire)"
  else:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Identifiants invalides. Veuillez vérifier votre nom d'utilisateur et mot de passe.",
      headers={"WWW-Authenticate": "Bearer"},
    )

  claims = {
    "sub": user_id,
    "username": username,
    "email": email,
    "role": role,
    "app_metadata": {"role": role},
    "user_metadata": {"full_name": full_name},
  }
  token = create_access_token(claims)

  return LoginResponse(
    access_token=token,
    token_type="bearer",
    user={
      "id": user_id,
      "username": username,
      "email": email,
      "role": role,
      "full_name": full_name,
    },
  )


@router.get("/me", summary="Get Current Authenticated User Profile")
def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
  """
  Returns the decoded profile and role permissions of the currently authenticated user.
  """
  return {
    "status": "authenticated",
    "user": {
      "id": current_user.id,
      "username": current_user.username,
      "email": current_user.email,
      "role": current_user.role,
      "app_metadata": current_user.app_metadata,
      "user_metadata": current_user.user_metadata,
    },
  }


@router.get("/admin-only", summary="Protected Admin-Only Resource")
def get_admin_data(admin_user: CurrentUser = Depends(require_admin)):
  """
  Protected endpoint accessible exclusively by users with role 'admin'.
  """
  return {
    "status": "authorized",
    "message": f"Welcome Administrator {admin_user.email}. You have full supervision access.",
  }


@router.post("/mock-token", summary="Generate a Mock JWT (Development / Testing)")
def create_mock_token(email: str = "admin@entreprise-transport.dz", role: str = "admin", user_id: str = "user-12345"):
  """
  Utility endpoint for local testing and CI to generate a valid signed JWT payload.
  """
  claims = {
    "sub": user_id,
    "username": "admin"if role == "admin"else "gestionnaire",
    "email": email,
    "role": role,
    "app_metadata": {"role": role, "provider": "email"},
    "user_metadata": {"full_name": "Administrateur Test"},
    "aud": "authenticated",
  }
  token = create_access_token(claims)
  return {
    "access_token": token,
    "token_type": "bearer",
    "expires_in": 86400,
    "user": claims,
  }
