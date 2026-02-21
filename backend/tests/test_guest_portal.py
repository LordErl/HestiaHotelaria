"""
Test Guest Portal Endpoints for Hestia Mobile App
Tests login by reservation code, reservations, services, loyalty, account, and booking

Test credentials:
- reservation_code: HESFC0FAA
- hotel_id: 480f0940-81a5-4ca7-806d-77ed790c740a
- guest_id: e5c892eb-24f2-4dc6-9abc-a804daa26c91
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://guest-app-preview.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')

# Test credentials provided
TEST_RESERVATION_CODE = "HESFC0FAA"
TEST_HOTEL_ID = "480f0940-81a5-4ca7-806d-77ed790c740a"
TEST_GUEST_ID = "e5c892eb-24f2-4dc6-9abc-a804daa26c91"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestGuestPortalAccess:
    """Test POST /api/guest-portal/access - Login by reservation code"""
    
    def test_login_with_valid_code(self, api_client):
        """Test login with valid reservation code"""
        response = api_client.post(
            f"{BASE_URL}/api/guest-portal/access",
            json={"code": TEST_RESERVATION_CODE}
        )
        
        print(f"Access endpoint status: {response.status_code}")
        print(f"Response: {response.json() if response.status_code == 200 else response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify success flag
        assert data.get("success") == True, "Expected success=True in response"
        
        # Verify guest object
        assert "guest" in data, "Response should contain guest object"
        guest = data["guest"]
        assert "id" in guest, "Guest should have id"
        assert "name" in guest, "Guest should have name"
        
        # Verify reservation object
        assert "reservation" in data, "Response should contain reservation object"
        reservation = data["reservation"]
        assert "id" in reservation, "Reservation should have id"
        assert "confirmation_code" in reservation, "Reservation should have confirmation_code"
        assert "check_in_date" in reservation, "Reservation should have check_in_date"
        assert "check_out_date" in reservation, "Reservation should have check_out_date"
        assert "status" in reservation, "Reservation should have status"
        
        # Verify hotel object
        assert "hotel" in data, "Response should contain hotel object"
        
        print(f"SUCCESS: Login with code {TEST_RESERVATION_CODE} returned guest: {guest['name']}")
    
    def test_login_with_invalid_code(self, api_client):
        """Test login with invalid reservation code"""
        response = api_client.post(
            f"{BASE_URL}/api/guest-portal/access",
            json={"code": "INVALIDCODE123"}
        )
        
        print(f"Invalid code status: {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404 for invalid code, got {response.status_code}"
        print("SUCCESS: Invalid code returns 404")
    
    def test_login_with_lowercase_code(self, api_client):
        """Test login with lowercase code (should be normalized to uppercase)"""
        response = api_client.post(
            f"{BASE_URL}/api/guest-portal/access",
            json={"code": TEST_RESERVATION_CODE.lower()}
        )
        
        print(f"Lowercase code status: {response.status_code}")
        
        # Should work because code is converted to uppercase
        assert response.status_code == 200, f"Expected 200 for lowercase code, got {response.status_code}"
        print("SUCCESS: Lowercase code is normalized and works")


class TestGuestReservations:
    """Test GET /api/guest-portal/reservations/{guest_id} - List guest reservations"""
    
    def test_get_guest_reservations(self, api_client):
        """Get all reservations for a guest"""
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/reservations/{TEST_GUEST_ID}"
        )
        
        print(f"Reservations endpoint status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"SUCCESS: Found {len(data)} reservations for guest {TEST_GUEST_ID}")
        
        # Verify structure if there are reservations
        if data:
            reservation = data[0]
            assert "id" in reservation, "Reservation should have id"
            assert "check_in_date" in reservation, "Reservation should have check_in_date"
            assert "check_out_date" in reservation, "Reservation should have check_out_date"
            assert "room_number" in reservation, "Reservation should have room_number"
            assert "room_type" in reservation, "Reservation should have room_type"
            assert "hotel_name" in reservation, "Reservation should have hotel_name"
            assert "nights" in reservation, "Reservation should have nights"
            print(f"First reservation: {reservation.get('confirmation_code', 'N/A')}")
    
    def test_get_reservations_invalid_guest(self, api_client):
        """Test getting reservations for non-existent guest"""
        fake_guest_id = str(uuid.uuid4())
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/reservations/{fake_guest_id}"
        )
        
        print(f"Non-existent guest status: {response.status_code}")
        
        # Should return empty list, not 404
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 0, "Should return empty list for non-existent guest"
        print("SUCCESS: Non-existent guest returns empty list")


class TestHotelServices:
    """Test GET /api/guest-portal/services/{hotel_id} - List available services"""
    
    def test_get_hotel_services(self, api_client):
        """Get available services for a hotel"""
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/services/{TEST_HOTEL_ID}"
        )
        
        print(f"Services endpoint status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return at least one service"
        
        # Verify service structure
        service = data[0]
        assert "id" in service, "Service should have id"
        assert "name" in service, "Service should have name"
        assert "description" in service, "Service should have description"
        assert "available" in service, "Service should have available hours"
        
        print(f"SUCCESS: Found {len(data)} services")
        for svc in data:
            print(f"  - {svc['name']}: {svc['description']}")


class TestServiceRequest:
    """Test POST /api/guest-portal/service-request - Create service request"""
    
    def test_create_service_request(self, api_client):
        """Create a service request"""
        request_data = {
            "hotel_id": TEST_HOTEL_ID,
            "guest_id": TEST_GUEST_ID,
            "room_number": "101",
            "service_type": "room_service",
            "service_name": "Room Service",
            "notes": "Test service request from pytest",
            "priority": "normal"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/guest-portal/service-request",
            json=request_data
        )
        
        print(f"Service request status: {response.status_code}")
        print(f"Response: {response.json() if response.status_code in [200, 201] else response.text}")
        
        assert response.status_code in [200, 201], f"Expected 200 or 201, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "request_id" in data, "Response should have request_id"
        
        print(f"SUCCESS: Created service request with ID: {data['request_id']}")
        return data['request_id']
    
    def test_create_service_request_high_priority(self, api_client):
        """Create a high priority service request"""
        request_data = {
            "hotel_id": TEST_HOTEL_ID,
            "guest_id": TEST_GUEST_ID,
            "room_number": "101",
            "service_type": "maintenance",
            "service_name": "Manutenção",
            "notes": "Urgent test from pytest",
            "priority": "high"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/guest-portal/service-request",
            json=request_data
        )
        
        assert response.status_code in [200, 201], f"Expected 200 or 201, got {response.status_code}"
        print("SUCCESS: High priority service request created")


class TestGuestServiceRequests:
    """Test GET /api/guest-portal/requests/{guest_id} - List service requests"""
    
    def test_get_guest_requests(self, api_client):
        """Get all service requests for a guest"""
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/requests/{TEST_GUEST_ID}"
        )
        
        print(f"Guest requests status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"SUCCESS: Found {len(data)} service requests for guest")
        
        # Verify structure if there are requests
        if data:
            req = data[0]
            print(f"First request: {req.get('service_name', 'N/A')} - {req.get('status', 'N/A')}")


class TestGuestLoyalty:
    """Test GET /api/guest-portal/loyalty/{guest_id} - Loyalty program info"""
    
    def test_get_loyalty_info(self, api_client):
        """Get loyalty information for a guest"""
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/loyalty/{TEST_GUEST_ID}",
            params={"hotel_id": TEST_HOTEL_ID}
        )
        
        print(f"Loyalty endpoint status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify member object
        assert "member" in data, "Response should have member object"
        member = data["member"]
        assert "guest_id" in member, "Member should have guest_id"
        assert "points" in member, "Member should have points"
        assert "tier" in member, "Member should have tier"
        
        # Verify tiers
        assert "tiers" in data, "Response should have tiers"
        tiers = data["tiers"]
        assert isinstance(tiers, list), "Tiers should be a list"
        
        # Verify rewards
        assert "rewards" in data, "Response should have rewards"
        rewards = data["rewards"]
        assert isinstance(rewards, list), "Rewards should be a list"
        
        print(f"SUCCESS: Guest has {member['points']} points, tier: {member['tier']}")
        print(f"Available tiers: {[t['name'] for t in tiers]}")
        print(f"Available rewards: {len(rewards)}")
    
    def test_get_loyalty_invalid_guest(self, api_client):
        """Test loyalty for non-existent guest"""
        fake_guest_id = str(uuid.uuid4())
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/loyalty/{fake_guest_id}",
            params={"hotel_id": TEST_HOTEL_ID}
        )
        
        print(f"Non-existent guest loyalty status: {response.status_code}")
        
        # Should return 404
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("SUCCESS: Non-existent guest returns 404")


class TestGuestAccount:
    """Test GET /api/guest-portal/account/{guest_id} - Guest account/balance"""
    
    def test_get_account_info(self, api_client):
        """Get account information for a guest"""
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/account/{TEST_GUEST_ID}"
        )
        
        print(f"Account endpoint status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify guest object
        assert "guest" in data, "Response should have guest object"
        guest = data["guest"]
        assert "id" in guest, "Guest should have id"
        assert "name" in guest, "Guest should have name"
        
        # Verify balance object
        assert "balance" in data, "Response should have balance object"
        balance = data["balance"]
        assert "total_charges" in balance, "Balance should have total_charges"
        assert "total_paid" in balance, "Balance should have total_paid"
        assert "pending" in balance, "Balance should have pending amount"
        
        # Verify transactions
        assert "transactions" in data, "Response should have transactions"
        transactions = data["transactions"]
        assert isinstance(transactions, list), "Transactions should be a list"
        
        print(f"SUCCESS: Guest account balance - Total: {balance['total_charges']}, Paid: {balance['total_paid']}, Pending: {balance['pending']}")
        print(f"Found {len(transactions)} transactions")
    
    def test_get_account_invalid_guest(self, api_client):
        """Test account for non-existent guest"""
        fake_guest_id = str(uuid.uuid4())
        response = api_client.get(
            f"{BASE_URL}/api/guest-portal/account/{fake_guest_id}"
        )
        
        print(f"Non-existent guest account status: {response.status_code}")
        
        # Should return 404
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("SUCCESS: Non-existent guest returns 404")


class TestGuestBooking:
    """Test POST /api/guest-portal/booking - Create new reservation"""
    
    def test_create_booking_no_rooms_available(self, api_client):
        """Test booking when no rooms available (expected behavior)"""
        # Use a fake room type ID to trigger no available rooms
        fake_room_type_id = str(uuid.uuid4())
        
        booking_data = {
            "guest_id": TEST_GUEST_ID,
            "hotel_id": TEST_HOTEL_ID,
            "room_type_id": fake_room_type_id,
            "check_in_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "check_out_date": (datetime.now() + timedelta(days=32)).strftime("%Y-%m-%d"),
            "adults": 2,
            "children": 0
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/guest-portal/booking",
            json=booking_data
        )
        
        print(f"Booking with fake room type status: {response.status_code}")
        
        # Should return 400 because no rooms available
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("SUCCESS: No rooms available returns 400")
    
    def test_booking_endpoint_exists(self, api_client):
        """Verify booking endpoint is accessible"""
        # First get room types for the hotel to get a valid room_type_id
        room_types_response = api_client.get(
            f"{BASE_URL}/api/room-types",
            params={"hotel_id": TEST_HOTEL_ID}
        )
        
        # This might require auth, so just verify endpoint exists
        print(f"Room types endpoint status: {room_types_response.status_code}")
        
        # Try booking with minimal data to verify endpoint
        booking_data = {
            "guest_id": TEST_GUEST_ID,
            "hotel_id": TEST_HOTEL_ID,
            "room_type_id": str(uuid.uuid4()),  # Use fake ID
            "check_in_date": (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d"),
            "check_out_date": (datetime.now() + timedelta(days=62)).strftime("%Y-%m-%d"),
            "adults": 1,
            "children": 0
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/guest-portal/booking",
            json=booking_data
        )
        
        # Should be 400 (no rooms) not 404 or 500, confirming endpoint works
        print(f"Booking endpoint status: {response.status_code}")
        assert response.status_code in [200, 201, 400], f"Unexpected status: {response.status_code}"
        print("SUCCESS: Booking endpoint is working (returns expected status)")


class TestIntegrationFlow:
    """Test complete flow: Login -> Get Info -> Request Service"""
    
    def test_full_guest_flow(self, api_client):
        """Test complete guest portal flow"""
        # Step 1: Login with reservation code
        login_response = api_client.post(
            f"{BASE_URL}/api/guest-portal/access",
            json={"code": TEST_RESERVATION_CODE}
        )
        
        assert login_response.status_code == 200, "Login should succeed"
        login_data = login_response.json()
        
        guest_id = login_data["guest"]["id"]
        hotel_id = login_data["reservation"]["hotel_id"]
        
        print(f"Step 1 - Logged in as: {login_data['guest']['name']}")
        
        # Step 2: Get reservations
        res_response = api_client.get(
            f"{BASE_URL}/api/guest-portal/reservations/{guest_id}"
        )
        assert res_response.status_code == 200, "Get reservations should succeed"
        print(f"Step 2 - Found {len(res_response.json())} reservations")
        
        # Step 3: Get available services
        services_response = api_client.get(
            f"{BASE_URL}/api/guest-portal/services/{hotel_id}"
        )
        assert services_response.status_code == 200, "Get services should succeed"
        print(f"Step 3 - Found {len(services_response.json())} services")
        
        # Step 4: Get account info
        account_response = api_client.get(
            f"{BASE_URL}/api/guest-portal/account/{guest_id}"
        )
        assert account_response.status_code == 200, "Get account should succeed"
        print(f"Step 4 - Account balance: {account_response.json()['balance']}")
        
        # Step 5: Get loyalty info
        loyalty_response = api_client.get(
            f"{BASE_URL}/api/guest-portal/loyalty/{guest_id}",
            params={"hotel_id": hotel_id}
        )
        assert loyalty_response.status_code == 200, "Get loyalty should succeed"
        print(f"Step 5 - Loyalty tier: {loyalty_response.json()['member']['tier']}")
        
        print("SUCCESS: Full guest portal flow completed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
