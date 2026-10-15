from google.cloud import firestore
from datetime import datetime, timezone
import json
import os
from dotenv import load_dotenv

load_dotenv()


class AutoCancelService:

    def __init__(self):
        service_account_info = json.loads(
            os.environ["GOOGLE_APPLICATION_CREDENTIALS_JSON"]
        )
        self.db = firestore.Client.from_service_account_info(service_account_info)

    def safe_parse_date(self, date_str):
        """Safely parse YYYY-MM-DD date strings."""
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except (ValueError, TypeError):
            print(f"⚠️ Invalid date format skipped: {date_str}")
            return None

    def send_contract_notification(self, receiver_id, contract_id, event_name, role):
        """Add a notification document for supplier or planner."""
        title = "Contract Auto-Cancelled"
        message = (
            f"The contract for '{event_name}' has been automatically cancelled because the event has passed "
            "and there were no successful transactions or deliveries."
        )

        notification_data = {
            "avatar": "A",
            "title": title,
            "message": message,
            "receiver_id": receiver_id,
            "referenced_id": contract_id,
            "referenced_type": "contract",
            "unread": True,
            "created_at": datetime.now(timezone.utc),
        }

        self.db.collection("notifications").add(notification_data)
        print(f"📩 Notification sent to {role}: {receiver_id}")

    def send_event_notification(self, receiver_id, event_id, event_name, role):
        """Send notification that event has been deleted."""
        title = "Event Deleted"
        message = (
            f"The event '{event_name}' has been automatically deleted because it has passed "
            "and there are no associated contracts."
        )

        notification_data = {
            "avatar": "A",
            "title": title,
            "message": message,
            "receiver_id": receiver_id,
            "unread": True,
            "created_at": datetime.now(timezone.utc),
        }

        self.db.collection("notifications").add(notification_data)
        print(f"📩 Event notification sent to {role}: {receiver_id}")


def auto_delete_expired_events(self):
    """Delete past events that have NO contracts and NO applications."""
    print(
        f"[{datetime.now()}] Checking for expired events with no contracts or applications..."
    )
    events_ref = self.db.collection("events").stream()
    now = datetime.now()

    for event_doc in events_ref:
        event = event_doc.to_dict()
        event_id = event_doc.id
        event_name = event.get("event_name", "Untitled Event")
        event_date_str = event.get("event_date", {}).get("date_value")

        event_date = self.safe_parse_date(event_date_str)

        # Skip invalid or future eventss
        if not event_date or event_date >= now:
            continue

        # Fetch ALL contracts for this event
        contracts = list(
            self.db.collection("contracts").where("event_id", "==", event_id).stream()
        )

        # Fetch ALL applications for this event
        applications = list(
            self.db.collection("applications")
            .where("event_id", "==", event_id)
            .stream()
        )

        # NEW LOGIC: Delete only if NO contracts AND NO applications
        if contracts or applications:
            print(
                f"⏩ Skipping delete for event {event_id} — it has contracts or applications."
            )
            continue

        # If both empty → delete event
        print(f"🗑 Deleting expired event {event_id} ({event_name})")
        planner_id = event.get("user_id") or event.get("planner_id")

        if planner_id:
            self.send_event_notification(planner_id, event_id, event_name, "planner")

        self.db.collection("events").document(event_id).delete()

    def auto_cancel_contracts(self):
        print(f"[{datetime.now()}] Checking for inactive or expired contracts...")
        contracts_ref = self.db.collection("contracts").stream()

        for contract_doc in contracts_ref:
            contract = contract_doc.to_dict()
            contract_id = contract_doc.id

            event_id = contract.get("event_id")
            if not event_id:
                continue

            # Fetch event
            event_ref = self.db.collection("events").document(event_id).get()
            if not event_ref.exists:
                continue

            event_data = event_ref.to_dict()
            event_date_str = event_data.get("event_date", {}).get("date_value")
            event_name = event_data.get("event_name", "Untitled Event")

            event_date = self.safe_parse_date(event_date_str)
            if not event_date:
                continue

            if contract.get("status") in ["Cancelled", "Completed"]:
                print(
                    f"⏩ Skipping contract {contract_id} (already {contract.get('status')})"
                )
                continue

            now = datetime.now()
            if event_date < now:
                # Check for transactions
                transactions = (
                    self.db.collection("transactions")
                    .where("contract_id", "==", contract_id)
                    .where("status", "in", ["HOLD", "COMPLETED"])
                    .get()
                )

                # Check for deliveries
                deliveries = (
                    self.db.collection("deliveries")
                    .where("contract_id", "==", contract_id)
                    .get()
                )

                if not transactions and not deliveries:
                    print(
                        f"🚫 Cancelling contract {contract_id} (expired and no activity)"
                    )

                    # Update contract status
                    self.db.collection("contracts").document(contract_id).update(
                        {
                            "status": "Cancelled",
                            "updated_at": datetime.now(timezone.utc),
                        }
                    )

                    # Send notifications
                    supplier_id = contract.get("supplier_id")
                    planner_id = contract.get("planner_id")

                    if supplier_id:
                        self.send_contract_notification(
                            supplier_id, contract_id, event_name, "supplier"
                        )
                    if planner_id:
                        self.send_contract_notification(
                            planner_id, contract_id, event_name, "planner"
                        )

        print("✅ Auto-cancel process complete.\n")
