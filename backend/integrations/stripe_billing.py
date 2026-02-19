"""
Stripe Billing Integration for Recurring Subscriptions
Handles subscription creation, management, and webhooks
"""
import stripe
import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Initialize Stripe with API key
stripe.api_key = os.environ.get('STRIPE_API_KEY', '')


class StripeBillingService:
    """Handles Stripe subscription billing operations"""
    
    def __init__(self, api_key: Optional[str] = None):
        if api_key:
            stripe.api_key = api_key
        self.webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
    
    # ==================== PRODUCTS & PRICES ====================
    
    async def create_product(self, name: str, description: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """Create a product in Stripe"""
        try:
            product = stripe.Product.create(
                name=name,
                description=description,
                metadata=metadata or {}
            )
            return {"success": True, "product_id": product.id, "product": dict(product)}
        except stripe.error.StripeError as e:
            logger.error(f"Stripe create product error: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_price(
        self, 
        product_id: str, 
        amount: int,  # Amount in cents
        currency: str = "brl",
        interval: str = "month",  # day, week, month, year
        interval_count: int = 1
    ) -> Dict[str, Any]:
        """Create a recurring price for a product"""
        try:
            price = stripe.Price.create(
                product=product_id,
                unit_amount=amount,
                currency=currency,
                recurring={
                    "interval": interval,
                    "interval_count": interval_count
                }
            )
            return {"success": True, "price_id": price.id, "price": dict(price)}
        except stripe.error.StripeError as e:
            logger.error(f"Stripe create price error: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== CUSTOMERS ====================
    
    async def create_customer(
        self, 
        email: str, 
        name: str = None, 
        metadata: Dict = None
    ) -> Dict[str, Any]:
        """Create or get existing Stripe customer"""
        try:
            # Check if customer already exists
            existing = stripe.Customer.list(email=email, limit=1)
            if existing.data:
                return {
                    "success": True, 
                    "customer_id": existing.data[0].id, 
                    "customer": dict(existing.data[0]),
                    "existing": True
                }
            
            # Create new customer
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return {
                "success": True, 
                "customer_id": customer.id, 
                "customer": dict(customer),
                "existing": False
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe create customer error: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== SUBSCRIPTIONS ====================
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_days: int = 0,
        metadata: Dict = None
    ) -> Dict[str, Any]:
        """Create a subscription for a customer"""
        try:
            sub_params = {
                "customer": customer_id,
                "items": [{"price": price_id}],
                "metadata": metadata or {},
                "payment_behavior": "default_incomplete",
                "expand": ["latest_invoice.payment_intent"]
            }
            
            if trial_days > 0:
                sub_params["trial_period_days"] = trial_days
            
            subscription = stripe.Subscription.create(**sub_params)
            
            result = {
                "success": True,
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "subscription": dict(subscription)
            }
            
            # If payment is needed, include client secret
            if subscription.latest_invoice and subscription.latest_invoice.payment_intent:
                result["client_secret"] = subscription.latest_invoice.payment_intent.client_secret
            
            return result
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe create subscription error: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_subscription_checkout(
        self,
        price_id: str,
        customer_email: str,
        success_url: str,
        cancel_url: str,
        trial_days: int = 0,
        metadata: Dict = None
    ) -> Dict[str, Any]:
        """Create a Checkout Session for subscription"""
        try:
            session_params = {
                "mode": "subscription",
                "line_items": [{"price": price_id, "quantity": 1}],
                "success_url": success_url,
                "cancel_url": cancel_url,
                "customer_email": customer_email,
                "metadata": metadata or {}
            }
            
            if trial_days > 0:
                session_params["subscription_data"] = {
                    "trial_period_days": trial_days
                }
            
            session = stripe.checkout.Session.create(**session_params)
            
            return {
                "success": True,
                "session_id": session.id,
                "checkout_url": session.url
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe checkout session error: {e}")
            return {"success": False, "error": str(e)}
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        cancel_at_period_end: bool = True
    ) -> Dict[str, Any]:
        """Cancel a subscription"""
        try:
            if cancel_at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            
            return {
                "success": True,
                "subscription_id": subscription_id,
                "status": subscription.status if hasattr(subscription, 'status') else 'canceled'
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe cancel subscription error: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get subscription details"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "success": True,
                "subscription": dict(subscription),
                "status": subscription.status,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe get subscription error: {e}")
            return {"success": False, "error": str(e)}
    
    async def update_subscription(
        self,
        subscription_id: str,
        new_price_id: str = None,
        metadata: Dict = None
    ) -> Dict[str, Any]:
        """Update a subscription (e.g., change plan)"""
        try:
            update_params = {}
            
            if new_price_id:
                # Get current subscription to find item ID
                sub = stripe.Subscription.retrieve(subscription_id)
                update_params["items"] = [{
                    "id": sub["items"]["data"][0]["id"],
                    "price": new_price_id
                }]
            
            if metadata:
                update_params["metadata"] = metadata
            
            subscription = stripe.Subscription.modify(subscription_id, **update_params)
            
            return {
                "success": True,
                "subscription_id": subscription_id,
                "status": subscription.status
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe update subscription error: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== BILLING PORTAL ====================
    
    async def create_billing_portal_session(
        self,
        customer_id: str,
        return_url: str
    ) -> Dict[str, Any]:
        """Create a billing portal session for customer self-service"""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            return {
                "success": True,
                "portal_url": session.url
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe billing portal error: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== WEBHOOKS ====================
    
    def verify_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Verify and parse webhook from Stripe"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return {"success": True, "event": event}
        except stripe.error.SignatureVerificationError:
            return {"success": False, "error": "Invalid signature"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def handle_webhook_event(self, event: Dict) -> Dict[str, Any]:
        """Process webhook events"""
        event_type = event.get("type", "")
        data = event.get("data", {}).get("object", {})
        
        handlers = {
            "customer.subscription.created": self._handle_subscription_created,
            "customer.subscription.updated": self._handle_subscription_updated,
            "customer.subscription.deleted": self._handle_subscription_deleted,
            "invoice.paid": self._handle_invoice_paid,
            "invoice.payment_failed": self._handle_payment_failed,
            "checkout.session.completed": self._handle_checkout_completed
        }
        
        handler = handlers.get(event_type)
        if handler:
            return handler(data)
        
        return {"handled": False, "event_type": event_type}
    
    def _handle_subscription_created(self, data: Dict) -> Dict:
        return {
            "handled": True,
            "action": "subscription_created",
            "subscription_id": data.get("id"),
            "customer_id": data.get("customer"),
            "status": data.get("status")
        }
    
    def _handle_subscription_updated(self, data: Dict) -> Dict:
        return {
            "handled": True,
            "action": "subscription_updated",
            "subscription_id": data.get("id"),
            "status": data.get("status"),
            "cancel_at_period_end": data.get("cancel_at_period_end")
        }
    
    def _handle_subscription_deleted(self, data: Dict) -> Dict:
        return {
            "handled": True,
            "action": "subscription_deleted",
            "subscription_id": data.get("id"),
            "customer_id": data.get("customer")
        }
    
    def _handle_invoice_paid(self, data: Dict) -> Dict:
        return {
            "handled": True,
            "action": "invoice_paid",
            "invoice_id": data.get("id"),
            "subscription_id": data.get("subscription"),
            "amount_paid": data.get("amount_paid")
        }
    
    def _handle_payment_failed(self, data: Dict) -> Dict:
        return {
            "handled": True,
            "action": "payment_failed",
            "invoice_id": data.get("id"),
            "subscription_id": data.get("subscription"),
            "attempt_count": data.get("attempt_count")
        }
    
    def _handle_checkout_completed(self, data: Dict) -> Dict:
        return {
            "handled": True,
            "action": "checkout_completed",
            "session_id": data.get("id"),
            "customer_id": data.get("customer"),
            "subscription_id": data.get("subscription")
        }


# Singleton instance
stripe_billing = StripeBillingService()
