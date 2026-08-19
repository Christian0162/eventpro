from fastapi import APIRouter, HTTPException, Depends
from services.delivery_service import DeliveryService
from models.schemas import DeliveryCreate
from dependencies import get_delivery_service

router = APIRouter(prefix="/api/v1")


@router.post("/delivery")
def create_delivery(
    payload: DeliveryCreate,
    service: DeliveryService = Depends(get_delivery_service),
):
    try:
        result = service.create_delivery(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
