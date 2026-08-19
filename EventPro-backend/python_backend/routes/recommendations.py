from fastapi import APIRouter, Depends, HTTPException
from models.schemas import RecommendRequest
from dependencies import get_gemini_service
from services.gemini_service import GeminiService

router = APIRouter(prefix="/api/v1")


@router.post("/recommend")
async def recommend_suppliers(
    req: RecommendRequest, service: GeminiService = Depends(get_gemini_service)
):
    try:
        return {
            "recommendations": service.get_recommendations(
                req.user_prompt, req.suppliers
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
