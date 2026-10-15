from fastapi import APIRouter, HTTPException
from services.auto_cancel_service import AutoCancelService

router = APIRouter(prefix="/api/v1")


@router.get("/run-auto-cancel")
def run_auto_cancel():
    service = AutoCancelService()
    try:
        service.auto_cancel_contracts()
        service.auto_delete_expired_events()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-cancel failed: {e}")
