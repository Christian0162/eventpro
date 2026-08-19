from xendit import Xendit
from models.schemas import EventCredential
import os
from dotenv import load_dotenv

load_dotenv()


class PaymentService:
    def __init__(self):
        api_key = os.getenv("XENDIT_SECRET_KEY")
        if not api_key:
            raise RuntimeError("Missing XENDIT_SECRET_KEY in environment")
        self.xendit = Xendit(api_key=api_key)

    def create_invoice(self, credential: EventCredential):
        return self.xendit.Invoice.create(
            external_id=credential.external_id,
            payer_email=credential.payer_email,
            description="required",
            amount=credential.net_amount,
            currency="PHP",
            invoice_duration=30,
            success_redirect_url="https://unite-eventpro.site/payment/success?id="
            + credential.external_id,
            failure_redirect_url="https://unite-eventpro.site/failed_payment",
            payment_methods=[credential.payment_method],
        )

    def check_status(self, invoice_id: str):
        return self.xendit.Invoice.get(invoice_id=invoice_id)
