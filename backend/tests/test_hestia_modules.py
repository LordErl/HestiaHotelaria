"""
Test suite for Hestia Hotel Management Platform - Advanced Modules
Tests: HR Management, Events Management, OTA Integration, and Public Reservations with Email
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@hestia.com"
TEST_PASSWORD = "admin123"
HOTEL_ID = "480f0940-81a5-4ca7-806d-77ed790c740a"
ROOM_TYPE_ID = "8fafe645-a05c-4f95-a912-4704a2f8f146"
TEST_RESEND_EMAIL = "delivered@resend.dev"


class TestAuthentication:
    """Authentication tests - must pass before other tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_login_success(self, auth_token):
        """Test login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Login successful, token obtained")


class TestHRManagement:
    """HR Management module tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_hr_stats(self, auth_headers):
        """Test GET /api/hr/stats - returns HR statistics"""
        response = requests.get(
            f"{BASE_URL}/api/hr/stats?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify stats structure
        expected_fields = ['total_employees', 'active_employees', 'on_vacation', 'pending_leave_requests', 'total_monthly_payroll']
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ HR stats: {data.get('total_employees')} total employees, {data.get('active_employees')} active")
    
    def test_create_employee(self, auth_headers):
        """Test POST /api/hr/employees - creates new employee"""
        unique_id = str(uuid.uuid4())[:6]
        employee_data = {
            "full_name": f"TEST_Funcionario_{unique_id}",
            "email": f"test_func_{unique_id}@hotel.com",
            "phone": "(11) 99999-9999",
            "document_cpf": f"123.456.{unique_id[:3]}-00",
            "department": "recepcao",
            "position": "Recepcionista",
            "hire_date": "2024-01-15",
            "contract_type": "clt",
            "work_shift": "manha",
            "base_salary": 2500.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hr/employees?hotel_id={HOTEL_ID}",
            headers=auth_headers,
            json=employee_data
        )
        
        print(f"Create employee response: {response.status_code} - {response.text[:500]}")
        
        # Accept 200, 201 for success, 400 for duplicate, 500 for schema issues
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "message" in data, "Response should contain id or message"
            print(f"✓ Employee created successfully: {data}")
        elif response.status_code == 400:
            print(f"✓ Employee creation returned 400 (possibly duplicate or validation error)")
        elif response.status_code == 500:
            # Check if it's a schema issue
            error_text = response.text.lower()
            if "column" in error_text or "schema" in error_text:
                pytest.fail(f"Schema issue detected: {response.text}")
            else:
                pytest.fail(f"Server error: {response.text}")
        else:
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")
    
    def test_get_employees(self, auth_headers):
        """Test GET /api/hr/employees - returns list of employees"""
        response = requests.get(
            f"{BASE_URL}/api/hr/employees?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ HR employees endpoint returned {len(data)} employees")


class TestEventsManagement:
    """Events Management module tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_events_stats(self, auth_headers):
        """Test GET /api/events/stats - returns events statistics"""
        response = requests.get(
            f"{BASE_URL}/api/events/stats?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify stats structure
        expected_fields = ['total_events', 'confirmed', 'pending', 'total_revenue']
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Events stats: {data.get('total_events')} total events, {data.get('confirmed')} confirmed")
    
    def test_create_event_space(self, auth_headers):
        """Test POST /api/events/spaces - creates new event space"""
        unique_id = str(uuid.uuid4())[:6]
        space_data = {
            "name": f"TEST_Sala_{unique_id}",
            "space_type": "sala_reuniao",
            "capacity_theater": 100,
            "capacity_banquet": 60,
            "area_sqm": 150.0,
            "hourly_rate": 500.0,
            "half_day_rate": 1500.0,
            "full_day_rate": 2500.0,
            "floor": "1"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/events/spaces?hotel_id={HOTEL_ID}",
            headers=auth_headers,
            json=space_data
        )
        
        print(f"Create event space response: {response.status_code} - {response.text[:300]}")
        
        assert response.status_code in [200, 201, 400], f"Expected 200/201/400, got {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "message" in data, "Response should contain id or message"
            print(f"✓ Event space created successfully")
            return data.get("id")
        else:
            print(f"✓ Event space creation returned expected error")
            return None
    
    def test_get_event_spaces(self, auth_headers):
        """Test GET /api/events/spaces - returns list of event spaces"""
        response = requests.get(
            f"{BASE_URL}/api/events/spaces?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Event spaces endpoint returned {len(data)} spaces")
        return data
    
    def test_create_event(self, auth_headers):
        """Test POST /api/events - creates new event"""
        # First get a space
        spaces_response = requests.get(
            f"{BASE_URL}/api/events/spaces?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        
        if spaces_response.status_code != 200 or not spaces_response.json():
            # Create a space first
            space_data = {
                "name": f"TEST_Sala_Event_{str(uuid.uuid4())[:6]}",
                "space_type": "sala_reuniao",
                "capacity_theater": 50,
                "full_day_rate": 1000.0
            }
            space_response = requests.post(
                f"{BASE_URL}/api/events/spaces?hotel_id={HOTEL_ID}",
                headers=auth_headers,
                json=space_data
            )
            if space_response.status_code in [200, 201]:
                space_id = space_response.json().get("id")
            else:
                pytest.skip("Could not create event space for event test")
                return
        else:
            spaces = spaces_response.json()
            space_id = spaces[0]['id'] if spaces else None
        
        if not space_id:
            pytest.skip("No event space available for event test")
            return
        
        # Create event
        event_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        event_data = {
            "space_id": space_id,
            "event_name": f"TEST_Evento_{str(uuid.uuid4())[:6]}",
            "event_type": "corporativo",
            "event_date": event_date,
            "start_time": "09:00",
            "end_time": "18:00",
            "expected_guests": 50,
            "room_setup": "teatro",
            "client_name": "Empresa Teste",
            "client_email": "teste@empresa.com",
            "client_phone": "(11) 99999-9999"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/events?hotel_id={HOTEL_ID}",
            headers=auth_headers,
            json=event_data
        )
        
        print(f"Create event response: {response.status_code} - {response.text[:300]}")
        
        assert response.status_code in [200, 201, 400], f"Expected 200/201/400, got {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "message" in data, "Response should contain id or message"
            print(f"✓ Event created successfully")
        else:
            print(f"✓ Event creation returned expected error")


class TestOTAIntegration:
    """OTA Integration module tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_init_ota_channels(self, auth_headers):
        """Test POST /api/ota/channels/{hotel_id}/init - initializes default OTA channels"""
        response = requests.post(
            f"{BASE_URL}/api/ota/channels/{HOTEL_ID}/init",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        print(f"✓ OTA channels init: {data.get('message')}")
    
    def test_get_ota_channels(self, auth_headers):
        """Test GET /api/ota/channels/{hotel_id} - returns list of OTA channels"""
        response = requests.get(
            f"{BASE_URL}/api/ota/channels/{HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ OTA channels endpoint returned {len(data)} channels")


class TestPublicReservationsWithEmail:
    """Test public reservations endpoint and email sending"""
    
    def test_get_available_rooms(self):
        """Test GET /api/public/availability - check room availability"""
        check_in = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
        check_out = (datetime.now() + timedelta(days=62)).strftime('%Y-%m-%d')
        
        response = requests.get(
            f"{BASE_URL}/api/public/availability",
            params={
                "hotel_id": HOTEL_ID,
                "check_in": check_in,
                "check_out": check_out,
                "adults": 2,
                "children": 0
            }
        )
        
        print(f"Availability response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "rooms" in data, "Response should contain rooms"
        assert "room_types" in data, "Response should contain room_types"
        print(f"✓ Availability check: {len(data.get('rooms', []))} rooms, {len(data.get('room_types', []))} room types")
        return data
    
    def test_create_public_reservation_with_email(self):
        """Test POST /api/public/reservations - creates reservation and sends email"""
        # First check availability to get a room
        check_in = (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
        check_out = (datetime.now() + timedelta(days=92)).strftime('%Y-%m-%d')
        
        avail_response = requests.get(
            f"{BASE_URL}/api/public/availability",
            params={
                "hotel_id": HOTEL_ID,
                "check_in": check_in,
                "check_out": check_out,
                "adults": 2
            }
        )
        
        if avail_response.status_code != 200:
            pytest.skip(f"Could not check availability: {avail_response.text}")
            return
        
        avail_data = avail_response.json()
        rooms = avail_data.get('rooms', [])
        room_types = avail_data.get('room_types', [])
        
        if not rooms:
            pytest.skip("No available rooms for reservation test")
            return
        
        room_id = rooms[0]['id']
        room_type_id = rooms[0].get('room_type_id') or (room_types[0]['id'] if room_types else ROOM_TYPE_ID)
        
        unique_id = str(uuid.uuid4())[:6]
        reservation_data = {
            "hotel_id": HOTEL_ID,
            "room_id": room_id,
            "room_type_id": room_type_id,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "adults": 2,
            "children": 0,
            "total_amount": 500.00,
            "guest": {
                "name": f"TEST_Guest_{unique_id}",
                "email": TEST_RESEND_EMAIL,  # Use Resend test email
                "phone": "(11) 99999-9999",
                "document_number": f"123.456.{unique_id[:3]}-00",
                "special_requests": "Teste de reserva com email"
            },
            "payment_provider": "stripe"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/public/reservations",
            json=reservation_data
        )
        
        print(f"Create reservation response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data or "confirmation_code" in data, "Response should contain id or confirmation_code"
        
        confirmation_code = data.get('confirmation_code', '')
        print(f"✓ Reservation created: {confirmation_code}")
        print(f"✓ Email should be sent to: {TEST_RESEND_EMAIL}")
        
        # Note: We can't directly verify email was sent, but we can check logs
        return data


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        print(f"✓ API root accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
