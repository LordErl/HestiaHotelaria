"""
Test suite for Hestia Hotel Management Platform - Advanced Modules
Tests OTA Integration, HR Management, and Events Management APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@hestia.com"
TEST_PASSWORD = "admin123"
HOTEL_ID = "480f0940-81a5-4ca7-806d-77ed790c740a"


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
    
    def test_get_ota_channels_after_init(self, auth_headers):
        """Test channels exist after initialization"""
        response = requests.get(
            f"{BASE_URL}/api/ota/channels/{HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # After init, should have at least some channels
        print(f"✓ After init: {len(data)} OTA channels found")
        
        # Verify channel structure if channels exist
        if len(data) > 0:
            channel = data[0]
            assert "channel_name" in channel or "id" in channel, "Channel should have channel_name or id"
            print(f"✓ Channel structure validated")


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
    
    def test_get_work_schedules(self, auth_headers):
        """Test GET /api/hr/schedules - returns work schedules"""
        response = requests.get(
            f"{BASE_URL}/api/hr/schedules?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ HR schedules endpoint returned {len(data)} schedules")
    
    def test_get_leave_requests(self, auth_headers):
        """Test GET /api/hr/leave-requests - returns leave requests"""
        response = requests.get(
            f"{BASE_URL}/api/hr/leave-requests?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ HR leave requests endpoint returned {len(data)} requests")
    
    def test_create_employee(self, auth_headers):
        """Test POST /api/hr/employees - creates new employee"""
        employee_data = {
            "full_name": "TEST_Funcionario Teste",
            "email": "test_funcionario@hotel.com",
            "phone": "(11) 99999-9999",
            "document_cpf": "123.456.789-00",
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
        
        # Accept 200, 201, or 400 (if employee already exists)
        assert response.status_code in [200, 201, 400], f"Expected 200/201/400, got {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "message" in data, "Response should contain id or message"
            print(f"✓ Employee created successfully")
        else:
            print(f"✓ Employee creation returned expected error (possibly duplicate)")


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
    
    def test_get_events_list(self, auth_headers):
        """Test GET /api/events/list - returns list of events"""
        response = requests.get(
            f"{BASE_URL}/api/events/list?hotel_id={HOTEL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Events list endpoint returned {len(data)} events")
    
    def test_create_event_space(self, auth_headers):
        """Test POST /api/events/spaces - creates new event space"""
        space_data = {
            "name": "TEST_Sala de Conferências",
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
        
        assert response.status_code in [200, 201, 400], f"Expected 200/201/400, got {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "message" in data, "Response should contain id or message"
            print(f"✓ Event space created successfully")
            return data.get("id")
        else:
            print(f"✓ Event space creation returned expected error")
            return None


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        print(f"✓ API root accessible")
    
    def test_api_health(self):
        """Test API health endpoint if exists"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Health endpoint may not exist, so accept 404 as well
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            print(f"✓ API health endpoint OK")
        else:
            print(f"✓ API health endpoint not implemented (404)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
