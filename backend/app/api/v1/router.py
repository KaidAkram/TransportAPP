from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.vehicules import router as vehicules_router
from app.api.v1.employes import router as employes_router
from app.api.v1.partenaires import router as partenaires_router

api_v1_router = APIRouter()

# Register core sub-routers
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(vehicules_router)
api_v1_router.include_router(employes_router)
api_v1_router.include_router(partenaires_router)
