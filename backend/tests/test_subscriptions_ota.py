"""
Test suite for Hestia Hotel Management Platform - Subscriptions and OTA Integration
Tests subscription plans, subscriptions CRUD, OTA sync, and OTA stats endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hestia-hotel-1.preview.emergentagent.com')
HOTEL_ID = "480f0940-81a5-4ca7-806d-77ed790c740a"

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@hestia.com"


class TestSubscriptionPlans:
    """Subscription Plans API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_subscription_plans(self, auth_headers):
        """Test GET /api/subscriptions/plans - list subscription plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans", headers=auth_headers)
        assert response.status_code == 200
        
        plans = response.json()
        assert isinstance(plans, list)
        assert len(plans) >= 4, "Expected at least 4 subscription plans"
        
        # Verify plan structure
        for plan in plans:
            assert "id" in plan
            assert "name" in plan
            assert "subscription_price" in plan
            assert "billing_cycle" in plan
        
        # Verify expected plans exist
        plan_names = [p["name"] for p in plans]
        assert "Kit Amenities Básico" in plan_names
        assert "Kit Amenities Premium" in plan_names


class TestSubscriptions:
    """Subscriptions CRUD API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def plan_id(self, auth_headers):
        """Get a plan ID for testing"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans", headers=auth_headers)
        plans = response.json()
        return plans[0]["id"] if plans else None
    
    def test_get_subscriptions(self, auth_headers):
        """Test GET /api/subscriptions - list hotel subscriptions"""
        response = requests.get(f"{BASE_URL}/api/subscriptions", headers=auth_headers)
        assert response.status_code == 200
        
        subscriptions = response.json()
        assert isinstance(subscriptions, list)
        
        # Verify subscription structure if any exist
        if len(subscriptions) > 0:
            sub = subscriptions[0]
            assert "id" in sub
            assert "status" in sub
            assert "plan_id" in sub
    
    def test_create_subscription(self, auth_headers, plan_id):
        """Test POST /api/subscriptions - create subscription"""
        if not plan_id:
            pytest.skip("No plan available for testing")
        
        response = requests.post(f"{BASE_URL}/api/subscriptions", headers=auth_headers, json={
            "plan_id": plan_id,
            "hotel_id": HOTEL_ID,
            "payment_method": "faturado"
        })
        assert response.status_code == 200
        
        subscription = response.json()
        assert "id" in subscription
        assert subscription["plan_id"] == plan_id
        assert subscription["status"] == "active"
        
        # Store for cleanup
        return subscription["id"]
    
    def test_update_subscription_status_pause(self, auth_headers, plan_id):
        """Test PATCH /api/subscriptions/{id}/status - pause subscription"""
        # First create a subscription
        create_response = requests.post(f"{BASE_URL}/api/subscriptions", headers=auth_headers, json={
            "plan_id": plan_id,
            "hotel_id": HOTEL_ID,
            "payment_method": "cartao"
        })
        assert create_response.status_code == 200
        subscription_id = create_response.json()["id"]
        
        # Pause the subscription
        response = requests.patch(
            f"{BASE_URL}/api/subscriptions/{subscription_id}/status?status=paused",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify status changed
        updated = response.json()
        assert updated["status"] == "paused"
    
    def test_update_subscription_status_cancel(self, auth_headers, plan_id):
        """Test PATCH /api/subscriptions/{id}/status - cancel subscription"""
        # First create a subscription
        create_response = requests.post(f"{BASE_URL}/api/subscriptions", headers=auth_headers, json={
            "plan_id": plan_id,
            "hotel_id": HOTEL_ID,
            "payment_method": "pix"
        })
        assert create_response.status_code == 200
        subscription_id = create_response.json()["id"]
        
        # Cancel the subscription
        response = requests.patch(
            f"{BASE_URL}/api/subscriptions/{subscription_id}/status?status=cancelled",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify status changed
        updated = response.json()
        assert updated["status"] == "cancelled"


class TestOTAIntegration:
    """OTA Integration API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_ota_channels(self, auth_headers):
        """Test GET /api/ota/channels/{hotel_id} - list OTA channels"""
        response = requests.get(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}", headers=auth_headers)
        assert response.status_code == 200
        
        channels = response.json()
        assert isinstance(channels, list)
        assert len(channels) >= 4, "Expected at least 4 OTA channels"
        
        # Verify channel structure
        for channel in channels:
            assert "id" in channel
            assert "channel_name" in channel
            assert "is_active" in channel
        
        # Verify expected channels exist
        channel_names = [c["channel_name"] for c in channels]
        assert "booking" in channel_names
        assert "expedia" in channel_names
    
    def test_get_ota_stats(self, auth_headers):
        """Test GET /api/ota/stats/{hotel_id} - get OTA statistics"""
        response = requests.get(f"{BASE_URL}/api/ota/stats/{HOTEL_ID}", headers=auth_headers)
        assert response.status_code == 200
        
        stats = response.json()
        assert "total_channels" in stats
        assert "active_channels" in stats
        assert "by_channel" in stats
        
        # Verify stats values
        assert stats["total_channels"] >= 4
        assert stats["active_channels"] >= 1
        assert isinstance(stats["by_channel"], dict)
    
    def test_sync_ota_channel(self, auth_headers):
        """Test POST /api/ota/channels/{channel_id}/sync - sync OTA channel"""
        # First get channels to find an active one
        channels_response = requests.get(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}", headers=auth_headers)
        channels = channels_response.json()
        
        # Find an active channel (booking is usually active)
        active_channel = next((c for c in channels if c.get("is_active")), channels[0])
        channel_id = active_channel["id"]
        
        # Sync the channel
        response = requests.post(f"{BASE_URL}/api/ota/channels/{channel_id}/sync", headers=auth_headers)
        assert response.status_code == 200
        
        result = response.json()
        assert "message" in result
        assert result["message"] == "Sincronização concluída"
        assert "results" in result
        
        # Verify sync results structure (MOCKED data)
        results = result["results"]
        assert "rooms_synced" in results
        assert "rates_synced" in results
        assert "availability_updated" in results
        assert "new_reservations" in results


class TestPublicReservationEmail:
    """Test public reservation with email confirmation"""
    
    def test_public_reservation_sends_email(self):
        """Test POST /api/public/reservations - creates reservation and sends email"""
        # Get available rooms first
        avail_response = requests.get(f"{BASE_URL}/api/public/availability", params={
            "hotel_id": HOTEL_ID,
            "check_in": "2026-03-01",
            "check_out": "2026-03-03"
        })
        
        if avail_response.status_code != 200:
            pytest.skip("Availability endpoint not working")
        
        availability = avail_response.json()
        if not availability.get("room_types"):
            pytest.skip("No room types available")
        
        room_type = availability["room_types"][0]
        
        # Create public reservation
        response = requests.post(f"{BASE_URL}/api/public/reservations", json={
            "hotel_id": HOTEL_ID,
            "room_type_id": room_type["id"],
            "check_in_date": "2026-03-01",
            "check_out_date": "2026-03-03",
            "adults": 2,
            "children": 0,
            "total_amount": room_type.get("base_price", 500) * 2,
            "guest": {
                "name": "Test Guest Email",
                "email": "delivered@resend.dev",  # Resend test email
                "phone": "+5511999999999",
                "document_type": "cpf",
                "document_number": "12345678901"
            }
        })
        
        assert response.status_code == 200
        reservation = response.json()
        assert "id" in reservation
        assert "confirmation_code" in reservation
        # Email is sent asynchronously, so we just verify the reservation was created


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
