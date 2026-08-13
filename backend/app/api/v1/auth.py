import time
from fastapi import APIRouter, Depends
from jose import jwt
from app.core.config import settings
from app.core.security import get_current_user, require_admin, CurrentUser

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])


@router.get("/me", summary="Get Current Authenticated User Profile")
def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns the decoded profile and role permissions of the currently authenticated Supabase user.
    """
    return {
        "status": "authenticated",
        "user": {
            "id": current_user.id,
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


@router.post("/mock-token", summary="Generate a Mock Supabase JWT (Development / Testing)")
def create_mock_token(email: str = "admin@entreprise-transport.dz", role: str = "admin", user_id: str = "user-12345"):
    """
    Utility endpoint for local testing and CI to generate a valid signed JWT payload.
    """
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "app_metadata": {"role": role, "provider": "email"},
        "user_metadata": {"full_name": "Administrateur Test"},
        "aud": "authenticated",
        "exp": int(time.time()) + 3600 * 24,
    }
    secret = settings.SUPABASE_JWT_SECRET if settings.SUPABASE_JWT_SECRET else "secret"
    token = jwt.encode(payload, secret, algorithm="HS256")
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 86400,
        "user": payload,
    }
