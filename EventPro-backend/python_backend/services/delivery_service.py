import os
import json
import time
import hmac
import hashlib
import requests
import uuid
from models.schemas import DeliveryCreate


class DeliveryService:
    def __init__(self):
        self.api_key = os.getenv("LALAMOVE_API_KEY")
        self.secret = os.getenv("LALAMOVE_SECRET")
        self.market = os.getenv("LALAMOVE_MARKET", "HK")  # Default to HK as in docs
        self.base_url = os.getenv(
            "LALAMOVE_BASE_URL", "https://rest.sandbox.lalamove.com"
        )

        if not self.api_key or not self.secret:
            raise RuntimeError("Missing Lalamove credentials in environment")

    def _generate_auth_header(self, method: str, path: str, body: dict = None) -> str:
        timestamp = str(int(time.time() * 1000))
        
        # Handle empty body for GET requests
        if body is None:
            body_str = ""
        else:
            body_str = json.dumps(body, separators=(",", ":")) if body else ""
        
        # Create signature according to Lalamove documentation
        raw_signature = f"{timestamp}\r\n{method}\r\n{path}\r\n\r\n{body_str}"

        signature = hmac.new(
            self.secret.encode("utf-8"), 
            raw_signature.encode("utf-8"), 
            hashlib.sha256
        ).hexdigest()

        return f"hmac {self.api_key}:{timestamp}:{signature}"

    def create_delivery(self, data: DeliveryCreate):
        path = "/v3/orders"
        
        # Generate a unique Request-ID
        request_id = str(uuid.uuid4())
        
        # Build the request body according to Lalamove API requirements
        body = {
            "serviceType": data.serviceType,
            "stops": [
                {
                    "location": {
                        "lat": str(stop.lat),
                        "lng": str(stop.lng)
                    },
                    "addresses": {
                        "en_HK": stop.address  # Using HK locale as per documentation
                    }
                }
                for stop in data.stops
            ],
            "requesterContact": {
                "name": "Sender Name",  # You'll need to add these fields to your schema
                "phone": "+85212345678"  # Hong Kong phone number format
            },
            "deliveries": [
                {
                    "toStop": 1,
                    "toContact": {
                        "name": "Recipient Name",
                        "phone": "+85287654321"
                    }
                }
            ]
        }
        
        # Add remarks if provided
        if data.remarks:
            body["specialRequests"] = [data.remarks]

        headers = {
            "Content-Type": "application/json",
            "Authorization": self._generate_auth_header("POST", path, body),
            "MARKET": self.market,  # Changed from X-LLM-Market to MARKET
            "Request-ID": request_id,  # Added Request-ID as per documentation
        }

        try:
            print(f"Making request to Lalamove API...")
            print(f"Market: {self.market}")
            print(f"Request-ID: {request_id}")
            print(f"URL: {self.base_url + path}")
            print(f"Headers: {headers}")
            print(f"Body: {json.dumps(body, indent=2)}")
            
            response = requests.post(
                self.base_url + path, 
                json=body, 
                headers=headers,
                timeout=30
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print(f"Response: {response.text}")
            
            if response.status_code >= 400:
                error_detail = f"Lalamove API Error {response.status_code}: {response.text}"
                raise Exception(error_detail)
                
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response: {str(e)}")