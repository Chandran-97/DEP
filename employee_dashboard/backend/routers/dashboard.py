from fastapi import APIRouter
from backend.services import dashboard_service
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
@router.get("/version")
def version(): return dashboard_service.get_data_version()
@router.get("/overview")
def overview(): return dashboard_service.get_dashboard()
