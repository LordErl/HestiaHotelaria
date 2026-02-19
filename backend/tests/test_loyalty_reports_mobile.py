"""
Test suite for Hestia Hotel Management Platform - Loyalty, Reports, and Mobile modules
Tests: Loyalty Program, Advanced Reports, Mobile Guest App, Mobile Staff App
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
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
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@hestia.com"


class TestLoyaltyProgram:
    """Loyalty Program endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_loyalty_config(self, auth_token):
        """Test GET /api/loyalty/config/{hotel_id} - returns loyalty program configuration"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/config/{HOTEL_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify config structure
        assert "program_name" in data
        assert "tiers" in data
        assert "redemption_options" in data
        assert "points_per_real" in data
        
        # Verify tiers (4 tiers: Bronze, Silver, Gold, Platinum)
        assert len(data["tiers"]) == 4
        tier_names = [t["name"] for t in data["tiers"]]
        assert "Bronze" in tier_names
        assert "Silver" in tier_names
        assert "Gold" in tier_names
        assert "Platinum" in tier_names
        
        # Verify redemption options (5 options)
        assert len(data["redemption_options"]) == 5
    
    def test_get_loyalty_stats(self, auth_token):
        """Test GET /api/loyalty/stats/{hotel_id} - returns loyalty statistics"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/stats/{HOTEL_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "total_members" in data
        assert "total_points_issued" in data
        assert "active_this_month" in data
        assert "points_redeemed_month" in data
        assert "by_tier" in data
        assert "avg_points_per_member" in data
        
        # Verify tier breakdown
        assert "Bronze" in data["by_tier"]
        assert "Silver" in data["by_tier"]
        assert "Gold" in data["by_tier"]
        assert "Platinum" in data["by_tier"]
    
    def test_get_loyalty_members(self, auth_token):
        """Test GET /api/loyalty/members/{hotel_id} - returns loyalty members list"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/members/{HOTEL_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list (may be empty if no members)
        assert isinstance(data, list)
    
    def test_add_loyalty_points(self, auth_token):
        """Test POST /api/loyalty/points/add - add points to a member"""
        response = requests.post(
            f"{BASE_URL}/api/loyalty/points/add",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "guest_id": "test-guest-loyalty-001",
                "hotel_id": HOTEL_ID,
                "points": 500,
                "reason": "Bônus de teste automatizado"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "message" in data
        assert "points_added" in data
        assert data["points_added"] == 500


class TestAdvancedReports:
    """Advanced Reports endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_reports_overview(self, auth_token):
        """Test GET /api/reports/overview/{hotel_id} - returns KPIs"""
        response = requests.get(
            f"{BASE_URL}/api/reports/overview/{HOTEL_ID}?period=month",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify overview structure
        assert "period" in data
        assert "kpis" in data
        assert "comparison" in data
        
        # Verify KPIs
        kpis = data["kpis"]
        assert "total_revenue" in kpis
        assert "total_reservations" in kpis
        assert "occupancy_rate" in kpis
        assert "adr" in kpis
        assert "revpar" in kpis
        assert "avg_stay_length" in kpis
        
        # Verify comparison metrics
        comparison = data["comparison"]
        assert "revenue_change" in comparison
        assert "occupancy_change" in comparison
        assert "adr_change" in comparison
    
    def test_get_reports_revenue(self, auth_token):
        """Test GET /api/reports/revenue/{hotel_id} - returns revenue report"""
        response = requests.get(
            f"{BASE_URL}/api/reports/revenue/{HOTEL_ID}?period=month",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify revenue report structure
        assert "period" in data
        assert "daily_data" in data
        assert isinstance(data["daily_data"], list)
        
        # Verify daily data structure (if data exists)
        if len(data["daily_data"]) > 0:
            day = data["daily_data"][0]
            assert "date" in day
            assert "rooms" in day
            assert "fnb" in day
            assert "spa" in day
            assert "total" in day
    
    def test_get_reports_occupancy(self, auth_token):
        """Test GET /api/reports/occupancy/{hotel_id} - returns occupancy report"""
        response = requests.get(
            f"{BASE_URL}/api/reports/occupancy/{HOTEL_ID}?period=month",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify occupancy report structure
        assert "period" in data
        assert "daily_data" in data
        assert isinstance(data["daily_data"], list)
        
        # Verify daily data structure (if data exists)
        if len(data["daily_data"]) > 0:
            day = data["daily_data"][0]
            assert "date" in day
            assert "occupancy" in day
            assert "rooms_sold" in day
            assert "rooms_available" in day
    
    def test_get_reports_guests(self, auth_token):
        """Test GET /api/reports/guests/{hotel_id} - returns guest analytics"""
        response = requests.get(
            f"{BASE_URL}/api/reports/guests/{HOTEL_ID}?period=month",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify guest analytics structure
        assert "period" in data
        assert "total_guests" in data
        assert "new_guests" in data
        assert "returning_guests" in data
        assert "returning_rate" in data
        assert "demographics" in data
        
        # Verify demographics
        demographics = data["demographics"]
        assert "by_country" in demographics
        assert "by_purpose" in demographics
        assert "by_booking_source" in demographics
    
    def test_get_reports_channels(self, auth_token):
        """Test GET /api/reports/channels/{hotel_id} - returns channel report"""
        response = requests.get(
            f"{BASE_URL}/api/reports/channels/{HOTEL_ID}?period=month",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify channel report structure
        assert "period" in data
        assert "channels" in data
        assert "totals" in data
        assert "insights" in data
        
        # Verify channels list
        assert isinstance(data["channels"], list)
        if len(data["channels"]) > 0:
            channel = data["channels"][0]
            assert "name" in channel
            assert "reservations" in channel
            assert "revenue" in channel
            assert "commission" in channel
            assert "adr" in channel


class TestMobileApps:
    """Mobile Apps endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    def test_get_mobile_staff_dashboard(self, auth_token):
        """Test GET /api/mobile/staff/dashboard - returns staff dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/mobile/staff/dashboard?hotel_id={HOTEL_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "today" in data
        assert "tasks" in data
        assert "requests" in data
        assert "alerts" in data
        
        # Verify today stats
        today = data["today"]
        assert "check_ins" in today
        assert "check_outs" in today
        assert "pending_housekeeping" in today
        assert "guest_requests" in today
    
    def test_post_mobile_guest_request(self, auth_token):
        """Test POST /api/mobile/guest/request - create service request"""
        response = requests.post(
            f"{BASE_URL}/api/mobile/guest/request",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "guest_id": "test-guest-mobile-001",
                "room_id": "501",
                "type": "room_service",
                "details": "Gostaria de solicitar café da manhã no quarto às 8h - teste automatizado"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "message" in data
        assert "request_id" in data
        assert "estimated_response" in data
        assert data["message"] == "Solicitação registrada"


class TestReportsPeriods:
    """Test reports with different periods"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hestia.com",
            "password": "admin123"
        })
        return response.json()["access_token"]
    
    @pytest.mark.parametrize("period", ["week", "month", "quarter", "year"])
    def test_reports_overview_periods(self, auth_token, period):
        """Test reports overview with different periods"""
        response = requests.get(
            f"{BASE_URL}/api/reports/overview/{HOTEL_ID}?period={period}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == period


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
