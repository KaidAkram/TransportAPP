from typing import Optional, List
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    email: str
    role: str = "gestionnaire"  # admin | gestionnaire
    app_metadata: dict = {}
    user_metadata: dict = {}


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> CurrentUser:
    """
    Validates the incoming Supabase JWT Bearer token and returns the parsed CurrentUser.
    Rejects missing or invalid tokens with HTTP 401.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        # 1. Attempt strict cryptographic verification with SUPABASE_JWT_SECRET
        if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET != "placeholder-jwt-secret":
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # 2. In local/development mode with placeholder keys: decode token claims
            payload = jwt.decode(
                token,
                key="secret",
                options={"verify_signature": False, "verify_aud": False},
            )

        user_id = payload.get("sub") or payload.get("id")
        email = payload.get("email") or "user@entreprise-transport.dz"

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing user identifier ('sub').",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Extract role from Supabase custom claims or app_metadata
        app_metadata = payload.get("app_metadata", {})
        user_metadata = payload.get("user_metadata", {})
        role = app_metadata.get("role") or user_metadata.get("role") or payload.get("role", "gestionnaire")

        return CurrentUser(
            id=str(user_id),
            email=email,
            role=role,
            app_metadata=app_metadata,
            user_metadata=user_metadata,
        )

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """
    Guard dependency that restricts access exclusively to Administrateur users.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrateur privilege required.",
        )
    return user
