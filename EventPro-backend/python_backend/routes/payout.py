from fastapi import APIRouter, HTTPException, Depends
from models.schemas import PayoutCredential
from services.payout_service import PayoutService
from dependencies import get_payout_service

router = APIRouter(prefix="/api/v1")


@router.post("/payout")
async def bank_withdrawal(
    credential: PayoutCredential,
    disbursement: PayoutService = Depends(get_payout_service),
):

    try:
        return disbursement.create_payout(credential)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payout/check-status/{payout_id}")
async def check_status(
    payout_id: str, service: PayoutService = Depends(get_payout_service)
):
    try:
        payout = service.check_status(payout_id)
        return payout
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
