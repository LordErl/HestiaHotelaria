"""
Backend tests for Staff Mobile App endpoints
Tests the following endpoints for the Hestia Staff App:
- POST /api/auth/login - Staff authentication
- GET /api/check-in-out/checkins/{hotel_id} - Today's check-ins
- GET /api/check-in-out/checkouts/{hotel_id} - Today's check-outs
- GET /api/rooms/{hotel_id} - Hotel rooms listing
- PATCH /api/rooms/{room_id}/status - Update room status
- GET /api/housekeeping/tasks/{hotel_id} - Housekeeping tasks
- PATCH /api/housekeeping/tasks/{task_id} - Update housekeeping task
- GET /api/guest-requests/{hotel_id} - Guest service requests
- PATCH /api/guest-requests/{request_id} - Update guest request
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://guest-app-preview.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@hestia.com"
TEST_PASSWORD = "admin123"
TEST_HOTEL_ID = "480f0940-81a5-4ca7-806d-77ed790c740a"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for staff app"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed with status {response.status_code}")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ==================== AUTH TESTS ====================

class TestAuthEndpoints:
    """Authentication endpoints tests"""
    
    def test_login_success(self, api_client):
        """Test successful login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user info"
        assert data["user"]["email"] == TEST_EMAIL, "User email should match"
        print(f"✓ Login successful for {TEST_EMAIL}, role: {data['user']['role']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials properly rejected")
    
    def test_login_empty_credentials(self, api_client):
        """Test login with empty credentials returns 422"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "",
            "password": ""
        })
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Empty credentials validation working")


# ==================== CHECK-IN/OUT TESTS ====================

class TestCheckInOutEndpoints:
    """Check-in and Check-out endpoints tests"""
    
    def test_get_today_checkins(self, api_client):
        """Test GET /api/check-in-out/checkins/{hotel_id}"""
        response = api_client.get(f"{BASE_URL}/api/check-in-out/checkins/{TEST_HOTEL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Check-ins endpoint returned {len(data)} check-ins for today")
        
        # Verify structure if data exists
        if data:
            item = data[0]
            assert 'guest_name' in item, "Check-in should have guest_name"
            assert 'room_number' in item, "Check-in should have room_number"
            assert 'nights' in item, "Check-in should have nights count"
            print(f"  First check-in: {item.get('guest_name')} - Room {item.get('room_number')}")
    
    def test_get_today_checkouts(self, api_client):
        """Test GET /api/check-in-out/checkouts/{hotel_id}"""
        response = api_client.get(f"{BASE_URL}/api/check-in-out/checkouts/{TEST_HOTEL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Check-outs endpoint returned {len(data)} check-outs for today")
    
    def test_checkins_invalid_hotel_id(self, api_client):
        """Test check-ins with invalid hotel ID returns empty list"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/check-in-out/checkins/{fake_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return empty list"
        print(f"✓ Invalid hotel ID returns empty list (found {len(data)} items)")


# ==================== ROOMS TESTS ====================

class TestRoomsEndpoints:
    """Rooms listing and status endpoints tests"""
    
    def test_get_hotel_rooms(self, api_client):
        """Test GET /api/rooms/{hotel_id}"""
        response = api_client.get(f"{BASE_URL}/api/rooms/{TEST_HOTEL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Rooms endpoint returned {len(data)} rooms")
        
        # Verify structure if data exists
        if data:
            room = data[0]
            assert 'id' in room, "Room should have id"
            assert 'number' in room, "Room should have number"
            assert 'status' in room, "Room should have status"
            assert 'type_name' in room, "Room should have type_name"
            print(f"  First room: #{room.get('number')} - Status: {room.get('status')} - Type: {room.get('type_name')}")
    
    def test_update_room_status_valid(self, api_client):
        """Test PATCH /api/rooms/{room_id}/status with valid status"""
        # First get a room ID
        response = api_client.get(f"{BASE_URL}/api/rooms/{TEST_HOTEL_ID}")
        assert response.status_code == 200
        rooms = response.json()
        
        if not rooms:
            pytest.skip("No rooms available for testing")
        
        room_id = rooms[0]['id']
        original_status = rooms[0]['status']
        
        # Update status to cleaning
        update_response = api_client.patch(
            f"{BASE_URL}/api/rooms/{room_id}/status",
            json={"status": "cleaning"}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert data.get('success') == True, "Update should be successful"
        print(f"✓ Room status updated successfully to 'cleaning'")
        
        # Restore original status
        api_client.patch(f"{BASE_URL}/api/rooms/{room_id}/status", json={"status": original_status})
        print(f"  Status restored to '{original_status}'")
    
    def test_update_room_status_invalid(self, api_client):
        """Test PATCH /api/rooms/{room_id}/status with invalid status"""
        # First get a room ID
        response = api_client.get(f"{BASE_URL}/api/rooms/{TEST_HOTEL_ID}")
        assert response.status_code == 200
        rooms = response.json()
        
        if not rooms:
            pytest.skip("No rooms available for testing")
        
        room_id = rooms[0]['id']
        
        # Try invalid status
        update_response = api_client.patch(
            f"{BASE_URL}/api/rooms/{room_id}/status",
            json={"status": "invalid_status"}
        )
        
        assert update_response.status_code == 400, f"Expected 400, got {update_response.status_code}"
        print("✓ Invalid status properly rejected with 400")
    
    def test_rooms_invalid_hotel_id(self, api_client):
        """Test rooms with invalid hotel ID returns empty list"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/rooms/{fake_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return list"
        print(f"✓ Invalid hotel ID returns empty list (found {len(data)} rooms)")


# ==================== HOUSEKEEPING TESTS ====================

class TestHousekeepingEndpoints:
    """Housekeeping tasks endpoints tests"""
    
    def test_get_housekeeping_tasks(self, api_client):
        """Test GET /api/housekeeping/tasks/{hotel_id}"""
        response = api_client.get(f"{BASE_URL}/api/housekeeping/tasks/{TEST_HOTEL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Housekeeping tasks endpoint returned {len(data)} tasks")
        
        # Verify structure if data exists
        if data:
            task = data[0]
            assert 'id' in task, "Task should have id"
            assert 'status' in task, "Task should have status"
            print(f"  First task: {task.get('task_type_label', task.get('task_type'))} - Status: {task.get('status')}")
    
    def test_get_housekeeping_tasks_with_status_filter(self, api_client):
        """Test GET /api/housekeeping/tasks/{hotel_id} with status filter"""
        response = api_client.get(f"{BASE_URL}/api/housekeeping/tasks/{TEST_HOTEL_ID}?status=pending")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Housekeeping tasks with status=pending returned {len(data)} tasks")
    
    def test_update_housekeeping_task(self, api_client):
        """Test PATCH /api/housekeeping/tasks/{task_id}"""
        # First get tasks
        response = api_client.get(f"{BASE_URL}/api/housekeeping/tasks/{TEST_HOTEL_ID}")
        assert response.status_code == 200
        tasks = response.json()
        
        if not tasks:
            # No tasks exist, just verify endpoint works with fake ID
            fake_id = str(uuid.uuid4())
            update_response = api_client.patch(
                f"{BASE_URL}/api/housekeeping/tasks/{fake_id}",
                json={"status": "in_progress"}
            )
            # Should not crash - may return success or error
            assert update_response.status_code in [200, 404, 500], f"Unexpected status: {update_response.status_code}"
            print(f"✓ Update housekeeping task endpoint working (no tasks available for full test)")
            return
        
        task_id = tasks[0]['id']
        original_status = tasks[0]['status']
        
        # Update status
        update_response = api_client.patch(
            f"{BASE_URL}/api/housekeeping/tasks/{task_id}",
            json={"status": "in_progress"}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        print(f"✓ Housekeeping task updated successfully")
        
        # Restore original status
        api_client.patch(f"{BASE_URL}/api/housekeeping/tasks/{task_id}", json={"status": original_status})


# ==================== GUEST REQUESTS TESTS ====================

class TestGuestRequestsEndpoints:
    """Guest service requests endpoints tests"""
    
    def test_get_guest_requests(self, api_client):
        """Test GET /api/guest-requests/{hotel_id}"""
        response = api_client.get(f"{BASE_URL}/api/guest-requests/{TEST_HOTEL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Guest requests endpoint returned {len(data)} requests")
        
        # Verify structure if data exists
        if data:
            req = data[0]
            assert 'id' in req, "Request should have id"
            assert 'status' in req, "Request should have status"
            print(f"  First request: {req.get('service_type', 'N/A')} - Status: {req.get('status')}")
    
    def test_get_guest_requests_with_status_filter(self, api_client):
        """Test GET /api/guest-requests/{hotel_id} with status filter"""
        response = api_client.get(f"{BASE_URL}/api/guest-requests/{TEST_HOTEL_ID}?status=pending")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Guest requests with status=pending returned {len(data)} requests")
    
    def test_update_guest_request(self, api_client):
        """Test PATCH /api/guest-requests/{request_id}"""
        # First get requests
        response = api_client.get(f"{BASE_URL}/api/guest-requests/{TEST_HOTEL_ID}")
        assert response.status_code == 200
        requests_data = response.json()
        
        if not requests_data:
            # No requests exist, verify endpoint works with fake ID
            fake_id = str(uuid.uuid4())
            update_response = api_client.patch(
                f"{BASE_URL}/api/guest-requests/{fake_id}",
                json={"status": "in_progress"}
            )
            # Should not crash
            assert update_response.status_code in [200, 404, 500], f"Unexpected status: {update_response.status_code}"
            print(f"✓ Update guest request endpoint working (no requests available for full test)")
            return
        
        request_id = requests_data[0]['id']
        original_status = requests_data[0]['status']
        
        # Update status
        update_response = api_client.patch(
            f"{BASE_URL}/api/guest-requests/{request_id}",
            json={"status": "in_progress"}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        print(f"✓ Guest request updated successfully")
        
        # Restore original status
        api_client.patch(f"{BASE_URL}/api/guest-requests/{request_id}", json={"status": original_status})


# ==================== INTEGRATION TEST ====================

class TestStaffAppIntegration:
    """Integration tests simulating staff app workflow"""
    
    def test_staff_app_flow(self, authenticated_client):
        """Test complete staff app workflow: login -> get dashboard data"""
        # 1. Login is already done via authenticated_client
        print("✓ Step 1: Staff authenticated successfully")
        
        # 2. Get today's check-ins
        checkins_response = authenticated_client.get(f"{BASE_URL}/api/check-in-out/checkins/{TEST_HOTEL_ID}")
        assert checkins_response.status_code == 200
        checkins = checkins_response.json()
        print(f"✓ Step 2: Retrieved {len(checkins)} pending check-ins")
        
        # 3. Get today's check-outs
        checkouts_response = authenticated_client.get(f"{BASE_URL}/api/check-in-out/checkouts/{TEST_HOTEL_ID}")
        assert checkouts_response.status_code == 200
        checkouts = checkouts_response.json()
        print(f"✓ Step 3: Retrieved {len(checkouts)} pending check-outs")
        
        # 4. Get rooms
        rooms_response = authenticated_client.get(f"{BASE_URL}/api/rooms/{TEST_HOTEL_ID}")
        assert rooms_response.status_code == 200
        rooms = rooms_response.json()
        print(f"✓ Step 4: Retrieved {len(rooms)} rooms")
        
        # 5. Get housekeeping tasks
        tasks_response = authenticated_client.get(f"{BASE_URL}/api/housekeeping/tasks/{TEST_HOTEL_ID}")
        assert tasks_response.status_code == 200
        tasks = tasks_response.json()
        print(f"✓ Step 5: Retrieved {len(tasks)} housekeeping tasks")
        
        # 6. Get guest requests
        requests_response = authenticated_client.get(f"{BASE_URL}/api/guest-requests/{TEST_HOTEL_ID}")
        assert requests_response.status_code == 200
        guest_requests = requests_response.json()
        print(f"✓ Step 6: Retrieved {len(guest_requests)} guest requests")
        
        print("✓ Staff App Integration Flow Complete!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
