from services.gemini_service import GeminiService
from services.payment_service import PaymentService
from services.payout_service import PayoutService
from services.refund_service import RefundService
from services.delivery_service import DeliveryService


def get_gemini_service():
    return GeminiService()


def get_payment_service():
    return PaymentService()


def get_payout_service():
    return PayoutService()


def get_refund_service():
    return RefundService()


def get_delivery_service():
    return DeliveryService()
