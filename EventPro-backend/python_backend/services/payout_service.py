import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
from models.schemas import PayoutCredential
import os
import uuid

load_dotenv()


class PayoutService:

    def __init__(self):
        api_key = os.getenv("XENDIT_SECRET_KEY")
        if not api_key:
            raise RuntimeError("Missing XENDIT_SECRET_KEY in environment")
        self.auth = HTTPBasicAuth(api_key, "")

    def create_payout(self, bank: PayoutCredential) -> dict:
        url = "https://api.xendit.co/v2/payouts"
        data = {
            "reference_id": bank.reference_id,
            "amount": bank.amount,
            "currency": "PHP",
            "channel_code": bank.channel_code,
            "channel_properties": {
                "account_number": bank.account_number,
                "account_holder_name": bank.account_holder_name,
            },
            "description": "Withdrawal to bank",
        }

        headers = {"idempotency-key": str(uuid.uuid4())}

        response = requests.post(url, json=data, auth=self.auth, headers=headers)

        if response.status_code != 200:
            raise Exception(response.json())

        return response.json()

    def check_status(self, payout_id: str) -> dict:

        url = f"https://api.xendit.co/v2/payouts/{payout_id}"
        response = requests.get(url, auth=self.auth)

        return response.json()
