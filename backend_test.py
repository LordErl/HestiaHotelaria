#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class HestiaAPITester:
    def __init__(self, base_url="https://708dbcce-f0a1-4109-8a30-af2c8fcec6f0.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.hotel_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.current_user = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_login(self, email="admin@hestia.com", password="admin123"):
        """Test login with existing user"""
        success, response = self.run_test(
            f"Login with {email}",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user = response.get('user', {})
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User: {self.current_user.get('name', 'Unknown')} - Role: {self.current_user.get('role', 'Unknown')} - Hotel: {self.current_user.get('hotel_id', 'None')}")
            return True
        return False

    def test_register_new_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@hestia.com"
        
        success, response = self.run_test(
            "Register new user",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "name": f"Test User {timestamp}",
                "role": "admin"
            }
        )
        return success

    def test_get_me(self):
        """Test get current user info"""
        return self.run_test("Get current user info", "GET", "auth/me", 200)

    def test_seed_data(self):
        """Test seeding demo data"""
        success, response = self.run_test("Seed demo data", "POST", "seed", 200)
        
        if success and 'hotel_id' in response:
            self.hotel_id = response['hotel_id']
            print(f"   Hotel ID obtained: {self.hotel_id}")
            return True
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        if not self.hotel_id:
            self.log_test("Dashboard stats", False, "No hotel_id available")
            return False
            
        return self.run_test(
            "Dashboard statistics",
            "GET",
            f"dashboard/stats?hotel_id={self.hotel_id}",
            200
        )

    def test_dashboard_charts(self):
        """Test dashboard chart endpoints"""
        if not self.hotel_id:
            self.log_test("Dashboard charts", False, "No hotel_id available")
            return False
            
        occupancy_success, _ = self.run_test(
            "Occupancy chart data",
            "GET",
            f"dashboard/occupancy-chart?hotel_id={self.hotel_id}&days=7",
            200
        )
        
        revenue_success, _ = self.run_test(
            "Revenue chart data",
            "GET",
            f"dashboard/revenue-chart?hotel_id={self.hotel_id}&days=7",
            200
        )
        
        return occupancy_success and revenue_success

    def test_hotels_endpoints(self):
        """Test hotel management endpoints"""
        success1, _ = self.run_test("Get hotels list", "GET", "hotels", 200)
        
        if self.hotel_id:
            success2, _ = self.run_test(
                "Get specific hotel",
                "GET",
                f"hotels/{self.hotel_id}",
                200
            )
            return success1 and success2
        return success1

    def test_rooms_endpoints(self):
        """Test room management endpoints"""
        if not self.hotel_id:
            self.log_test("Rooms endpoints", False, "No hotel_id available")
            return False
            
        success1, rooms_data = self.run_test(
            "Get rooms list",
            "GET",
            f"rooms?hotel_id={self.hotel_id}",
            200
        )
        
        # Test room types
        success2, _ = self.run_test(
            "Get room types",
            "GET",
            f"room-types?hotel_id={self.hotel_id}",
            200
        )
        
        # Test updating room status if we have rooms
        success3 = True
        if success1 and rooms_data and len(rooms_data) > 0:
            room_id = rooms_data[0]['id']
            success3, _ = self.run_test(
                "Update room status",
                "PATCH",
                f"rooms/{room_id}",
                200,
                data={"status": "cleaning"}
            )
        
        return success1 and success2 and success3

    def test_guests_endpoints(self):
        """Test guest management endpoints"""
        if not self.hotel_id:
            self.log_test("Guests endpoints", False, "No hotel_id available")
            return False
            
        return self.run_test(
            "Get guests list",
            "GET",
            f"guests?hotel_id={self.hotel_id}",
            200
        )

    def test_reservations_endpoints(self):
        """Test reservation management endpoints"""
        if not self.hotel_id:
            self.log_test("Reservations endpoints", False, "No hotel_id available")
            return False
            
        success1, reservations_data = self.run_test(
            "Get reservations list",
            "GET",
            f"reservations?hotel_id={self.hotel_id}",
            200
        )
        
        # Test check-in/check-out if we have reservations
        success2 = True
        success3 = True
        
        if success1 and reservations_data and len(reservations_data) > 0:
            # Find a reservation that can be checked in
            for reservation in reservations_data:
                if reservation['status'] in ['pending', 'confirmed']:
                    reservation_id = reservation['id']
                    success2, _ = self.run_test(
                        "Check-in reservation",
                        "POST",
                        f"reservations/{reservation_id}/check-in",
                        200
                    )
                    break
            
            # Find a checked-in reservation to check out
            for reservation in reservations_data:
                if reservation['status'] == 'checked_in':
                    reservation_id = reservation['id']
                    success3, _ = self.run_test(
                        "Check-out reservation",
                        "POST",
                        f"reservations/{reservation_id}/check-out",
                        200
                    )
                    break
        
        return success1 and success2 and success3

    def test_ai_chat(self):
        """Test AI chat functionality"""
        # Test Hestia chat
        success1, _ = self.run_test(
            "Chat with Hestia AI",
            "POST",
            "chat",
            200,
            data={
                "message": "Olá, como está a ocupação do hotel hoje?",
                "agent_type": "hestia"
            }
        )
        
        # Test Jarbas chat
        success2, _ = self.run_test(
            "Chat with Jarbas AI",
            "POST",
            "chat",
            200,
            data={
                "message": "Olá, quais são os serviços disponíveis?",
                "agent_type": "jarbas"
            }
        )
        
        return success1 and success2

    def test_public_hotels_api(self):
        """Test public hotels API for booking engine"""
        # This endpoint should work without authentication
        old_token = self.token
        self.token = None  # Remove auth for public endpoint
        
        success, response = self.run_test(
            "Public hotels API",
            "GET",
            "public/hotels",
            200
        )
        
        self.token = old_token  # Restore auth
        return success

    def test_public_availability_api(self):
        """Test public availability API for booking engine"""
        if not self.hotel_id:
            self.log_test("Public availability API", False, "No hotel_id available")
            return False
            
        # This endpoint should work without authentication
        old_token = self.token
        self.token = None  # Remove auth for public endpoint
        
        success, response = self.run_test(
            "Public availability API",
            "GET",
            f"public/availability?hotel_id={self.hotel_id}&check_in=2024-12-25&check_out=2024-12-27&adults=2&children=0",
            200
        )
        
        self.token = old_token  # Restore auth
        return success

    def test_public_reservation_creation(self):
        """Test public reservation creation for booking engine"""
        if not self.hotel_id:
            self.log_test("Public reservation creation", False, "No hotel_id available")
            return False
            
        # First get available rooms
        old_token = self.token
        self.token = None
        
        # Get availability
        success, availability_data = self.run_test(
            "Get availability for reservation test",
            "GET",
            f"public/availability?hotel_id={self.hotel_id}&check_in=2024-12-25&check_out=2024-12-27&adults=2&children=0",
            200
        )
        
        if not success or not availability_data.get('rooms') or not availability_data.get('room_types'):
            self.log_test("Public reservation creation", False, "No available rooms for test")
            self.token = old_token
            return False
            
        # Use first available room and room type
        room = availability_data['rooms'][0]
        room_type = availability_data['room_types'][0]
        
        # Create reservation
        success, response = self.run_test(
            "Public reservation creation",
            "POST",
            "public/reservations",
            200,
            data={
                "hotel_id": self.hotel_id,
                "room_id": room['id'],
                "room_type_id": room_type['id'],
                "check_in_date": "2024-12-25",
                "check_out_date": "2024-12-27",
                "adults": 2,
                "children": 0,
                "total_amount": room_type['base_price'] * 2,  # 2 nights
                "guest": {
                    "name": "Test Guest",
                    "email": "test@guest.com",
                    "phone": "+55 11 99999-0000",
                    "document_number": "123.456.789-00",
                    "special_requests": "Test reservation"
                },
                "payment_provider": "stripe"
            }
        )
        
        self.token = old_token  # Restore auth
        return success

    def test_guest_portal_login(self):
        """Test guest portal login functionality"""
        # This endpoint should work without authentication
        old_token = self.token
        self.token = None
        
        # Try to login with a test confirmation code (this will likely fail but we test the endpoint)
        success, response = self.run_test(
            "Guest portal login (test endpoint)",
            "POST",
            "guest-portal/login",
            404,  # Expect 404 since we're using a fake confirmation code
            data={
                "email": "test@guest.com",
                "confirmation_code": "TEST1234"
            }
        )
        
        self.token = old_token
        # Return True if we get expected 404 (endpoint working but no matching reservation)
        return success

    def test_guest_portal_chat(self):
        """Test guest portal chat functionality"""
        # This endpoint should work without authentication
        old_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Guest portal chat with Jarbas",
            "POST",
            "guest-portal/chat",
            200,
            data={
                "message": "Olá, preciso de ajuda com room service",
                "session_id": "test_session_123",
                "guest_id": "test_guest_id"
            }
        )
        
        self.token = old_token
        return success

    def test_platform_admin_endpoints(self):
        """Test platform admin specific endpoints"""
        print("\n🏢 Testing Platform Admin Endpoints")
        
        # Test platform dashboard
        success1, _ = self.run_test(
            "Platform Dashboard",
            "GET",
            "platform/dashboard",
            200
        )
        
        # Test platform hotels list
        success2, _ = self.run_test(
            "Platform Hotels List",
            "GET", 
            "platform/hotels",
            200
        )
        
        # Test platform users list
        success3, _ = self.run_test(
            "Platform Users List",
            "GET",
            "platform/users", 
            200
        )
        
        # Test platform organizations (may return empty list)
        success4, _ = self.run_test(
            "Platform Organizations List",
            "GET",
            "platform/organizations",
            200
        )
        
        return success1 and success2 and success3 and success4

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🏨 Starting Hestia Hotel Management API Tests")
        print("=" * 60)
        
        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication tests
        login_success = self.test_login()
        if not login_success:
            print("❌ Login failed - cannot continue with authenticated tests")
            return False
            
        self.test_register_new_user()
        self.test_get_me()
        
        # Data seeding
        seed_success = self.test_seed_data()
        if not seed_success:
            print("⚠️  Seed data failed - some tests may not work properly")
        
        # Core functionality tests
        self.test_dashboard_stats()
        self.test_dashboard_charts()
        self.test_hotels_endpoints()
        self.test_rooms_endpoints()
        self.test_guests_endpoints()
        self.test_reservations_endpoints()
        
        # AI functionality
        self.test_ai_chat()
        
        # Onda 2: Public Booking Engine APIs
        print("\n🌊 Testing Onda 2 - Public Booking Engine APIs")
        self.test_public_hotels_api()
        self.test_public_availability_api()
        self.test_public_reservation_creation()
        
        # Onda 2: Guest Portal APIs
        print("\n🏨 Testing Onda 2 - Guest Portal APIs")
        self.test_guest_portal_login()
        self.test_guest_portal_chat()
        
        # Platform Admin APIs  
        print("\n🏢 Testing Platform Admin APIs")
        self.test_platform_admin_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    """Main test execution"""
    tester = HestiaAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())