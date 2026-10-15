import requests
from xendit import Xendit
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
from models.schemas import RefundRequest
import os
import uuid

load_dotenv()


class RefundService:
    def __init__(self):
        api_key = os.getenv("XENDIT_SECRET_KEY")
        if not api_key:
            raise RuntimeError("Missing XENDIT_SECRET_KEY in environment")
        self.auth = HTTPBasicAuth(api_key, "")

    def create_refund(self, credential: RefundRequest) -> list:
        url = "https://api.xendit.co/refunds"
        refunds = []
        for refund in credential.refund:
            data = {
                "reference_id": refund.reference_id,
                "amount": refund.amount,
                "currency": "PHP",
                "invoice_id": refund.invoice_id,
            }
            response = requests.post(url, json=data, auth=self.auth)
            if response.status_code != 200:
                raise Exception(response.json())
            refunds.append(response.json())

        return refunds

    def get_refund_status(self, refund_id: str) -> dict:
        url = f"https://api.xendit.co/refunds/{refund_id}"
        response = requests.get(url, auth=self.auth)
        if response.status_code != 200:
            raise Exception(response.json())
        return response.json()

    def get_multiple_refunds(self, refund_ids: list) -> list:
        results = []
        for rid in refund_ids:
            results.append(self.get_refund_status(rid))
        return results
