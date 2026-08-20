from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.admin_features import router as admin_features_router
from app.api.v1.vehicules import router as vehicules_router
from app.api.v1.employes import router as employes_router
from app.api.v1.partenaires import router as partenaires_router
from app.api.v1.contrats import router as contrats_router
from app.api.v1.cautions import router as cautions_router
from app.api.v1.stock import router as stock_router
from app.api.v1.interventions import router as interventions_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.factures import router as factures_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.documents import router as documents_router
from app.api.v1.settings import router as settings_router

api_v1_router = APIRouter()

# Register all ERP module sub-routers
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(settings_router)
api_v1_router.include_router(admin_features_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(vehicules_router)
api_v1_router.include_router(employes_router)
api_v1_router.include_router(partenaires_router)
api_v1_router.include_router(contrats_router)
api_v1_router.include_router(cautions_router)
api_v1_router.include_router(stock_router)
api_v1_router.include_router(interventions_router)
api_v1_router.include_router(factures_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(documents_router)
