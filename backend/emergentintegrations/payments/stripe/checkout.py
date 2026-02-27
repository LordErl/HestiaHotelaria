"""
Compatibility shim for emergentintegrations.payments.stripe.checkout
Uses Stripe SDK directly
"""
import stripe as stripe_sdk
import asyncio
from dataclasses import dataclass, field
from typing import Optional, Dict


@dataclass
class CheckoutSessionRequest:
    amount: float
    currency: str = "brl"
    success_url: str = ""
    cancel_url: str = ""
    metadata: Dict = field(default_factory=dict)


@dataclass
class CheckoutSessionResponse:
    session_id: str
    url: str


@dataclass
class CheckoutStatusResponse:
    session_id: str
    payment_status: str
    amount_total: Optional[float] = None


@dataclass
class WebhookResponse:
    session_id: str
    payment_status: str
    event_type: str = ""


class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str = ""):
        self.api_key = api_key
        self.webhook_url = webhook_url
        stripe_sdk.api_key = api_key

    async def create_checkout_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        loop = asyncio.get_event_loop()

        def _create():
            session = stripe_sdk.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": request.currency,
                        "product_data": {"name": "Reserva Hotel Hestia"},
                        "unit_amount": int(request.amount * 100),
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                metadata=request.metadata,
            )
            return session

        session = await loop.run_in_executor(None, _create)
        return CheckoutSessionResponse(session_id=session.id, url=session.url)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        loop = asyncio.get_event_loop()

        def _get():
            return stripe_sdk.checkout.Session.retrieve(session_id)

        session = await loop.run_in_executor(None, _get)
        return CheckoutStatusResponse(
            session_id=session.id,
            payment_status=session.payment_status,
            amount_total=session.amount_total / 100 if session.amount_total else None,
        )

    async def handle_webhook(self, body: bytes, signature: str) -> WebhookResponse:
        webhook_secret = None  # Set if you have a webhook secret
        try:
            if webhook_secret:
                event = stripe_sdk.Webhook.construct_event(body, signature, webhook_secret)
            else:
                import json
                event = json.loads(body)
        except Exception:
            import json
            event = json.loads(body)

        event_type = event.get("type", "")
        session_data = event.get("data", {}).get("object", {})
        session_id = session_data.get("id", "")
        payment_status = session_data.get("payment_status", "unpaid")

        return WebhookResponse(
            session_id=session_id,
            payment_status=payment_status,
            event_type=event_type,
        )
