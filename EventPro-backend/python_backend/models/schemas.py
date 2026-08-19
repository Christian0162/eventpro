from pydantic import BaseModel
from typing import List, Optional


class Supplier(BaseModel):
    name: str
    category: str
    avg_rating: float
    reviews: str


class RecommendRequest(BaseModel):
    user_prompt: str
    suppliers: List[Supplier]


class EventCredential(BaseModel):
    external_id: str
    net_amount: float
    payer_email: str
    payment_method: str


class Stop(BaseModel):
    address: str
    lat: float
    lng: float


class DeliveryCreate(BaseModel):
    serviceType: str
    stops: List[Stop]
    remarks: Optional[str] = None


class DeliveryResponse(BaseModel):
    orderId: str
    status: str


class InvoiceResponse(BaseModel):
    data: dict
    invoice_url: str


class StatusResponse(BaseModel):
    status: str


class RefundCredential(BaseModel):
    invoice_id: str
    amount: float
    reference_id: str


class RefundRequest(BaseModel):
    refund: List[RefundCredential]


class RefundStatusRequest(BaseModel):
    refund_ids: List[str]


class PayoutCredential(BaseModel):
    reference_id: str
    channel_code: str
    account_holder_name: str
    account_number: str
    amount: int
