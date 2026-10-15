from fastapi import APIRouter, Depends, HTTPException
from models.schemas import RefundRequest, RefundStatusRequest
from dependencies import get_refund_service
from services.refund_service import RefundService

router = APIRouter(prefix="/api/v1")


@router.post("/refund")
async def refund_payment(
    data: RefundRequest, service: RefundService = Depends(get_refund_service)
):
    try:
        refund = service.create_refund(data)
        return {"data": refund}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refund/status")
async def refund_status(
    data: RefundStatusRequest, service: RefundService = Depends(get_refund_service)
):
    try:
        statuses = service.get_multiple_refunds(data.refund_ids)
        return {"data": statuses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
