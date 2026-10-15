from fastapi import APIRouter, Depends, HTTPException, Query
from models.schemas import EventCredential
from dependencies import get_payment_service
from services.payment_service import PaymentService

router = APIRouter(prefix="/api/v1")


@router.post("/create-checkout-session")
async def pay_supplier(
    data: EventCredential, service: PaymentService = Depends(get_payment_service)
):
    try:
        invoice = service.create_invoice(data)
        return {"data": invoice.__dict__, "invoice_url": invoice.invoice_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment/check-status")
async def check_status(
    id: str = Query(...), service: PaymentService = Depends(get_payment_service)
):
    try:
        invoice = service.check_status(id)
        return {"status": invoice.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
