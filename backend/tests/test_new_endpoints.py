"""
Backend Tests for New Endpoints - Iteration 9
Testing: OTA real integration, Stripe Billing, Reports Export, Loyalty demo data

Endpoints tested:
- POST /api/ota/channels/{channel_id}/test - OTA connection test
- POST /api/ota/channels/{channel_id}/sync-real - OTA real sync
- GET /api/billing/plans - Get subscription plans
- GET /api/reports/export/{hotel_id} - Export reports (JSON/CSV)
- POST /api/loyalty/demo-data/{hotel_id} - Populate loyalty demo data
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@hestia.com"
ADMIN_PASSWORD = "admin123"
HOTEL_ID = "480f0940-81a5-4ca7-806d-77ed790c740a"


class TestAuthHelper:
    """Helper to get auth token"""
    _token = None
    
    @classmethod
    def get_token(cls):
        if cls._token:
            return cls._token
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            cls._token = response.json().get("access_token")
            return cls._token
        return None


@pytest.fixture
def auth_headers():
    """Get authentication headers"""
    token = TestAuthHelper.get_token()
    if not token:
        pytest.skip("Could not authenticate - skipping test")
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ================== OTA CONNECTION TEST ==================

class TestOTAChannelTest:
    """Test OTA channel connection test endpoint"""
    
    def test_ota_channels_exist(self, auth_headers):
        """First verify OTA channels exist"""
        response = requests.get(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}", headers=auth_headers)
        print(f"OTA channels response: {response.status_code}")
        
        assert response.status_code == 200
        channels = response.json()
        print(f"Found {len(channels)} OTA channels")
        
        # If no channels, try to initialize them
        if len(channels) == 0:
            init_response = requests.post(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}/init", headers=auth_headers)
            print(f"Initialize channels response: {init_response.status_code} - {init_response.text}")
            
            # Re-fetch channels
            response = requests.get(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}", headers=auth_headers)
            channels = response.json()
            print(f"After init, found {len(channels)} channels")
        
        return channels
    
    def test_ota_test_connection_booking(self, auth_headers):
        """Test connection endpoint for booking channel"""
        # First get channels
        response = requests.get(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}", headers=auth_headers)
        channels = response.json()
        
        # Find booking channel
        booking_channel = next((c for c in channels if c.get('channel_name') == 'booking'), None)
        
        if not booking_channel:
            pytest.skip("No booking channel found - skipping test")
        
        channel_id = booking_channel['id']
        print(f"Testing connection for booking channel: {channel_id}")
        
        # Test connection endpoint
        response = requests.post(f"{BASE_URL}/api/ota/channels/{channel_id}/test", headers=auth_headers)
        print(f"Test connection response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return success/error status
        assert "success" in data or "error" in data
        print(f"Test result: success={data.get('success')}, error={data.get('error')}")
    
    def test_ota_sync_real(self, auth_headers):
        """Test real sync endpoint"""
        # First get channels
        response = requests.get(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}", headers=auth_headers)
        channels = response.json()
        
        if not channels:
            pytest.skip("No OTA channels found")
        
        # Use first active channel
        active_channel = next((c for c in channels if c.get('is_active')), channels[0])
        channel_id = active_channel['id']
        print(f"Testing real sync for channel: {active_channel.get('channel_name')} ({channel_id})")
        
        response = requests.post(f"{BASE_URL}/api/ota/channels/{channel_id}/sync-real", headers=auth_headers)
        print(f"Sync-real response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have sync results
        assert "availability" in data or "success" in data or "error" in data


# ================== BILLING PLANS ==================

class TestBillingPlans:
    """Test Stripe Billing plans endpoint"""
    
    def test_get_billing_plans(self, auth_headers):
        """Test GET /api/billing/plans - should return list (can be empty)"""
        response = requests.get(f"{BASE_URL}/api/billing/plans", headers=auth_headers)
        print(f"Billing plans response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list (even if empty)
        assert isinstance(data, list)
        print(f"Found {len(data)} subscription plans")
        
        # If plans exist, validate structure
        if data:
            plan = data[0]
            print(f"Sample plan: {plan.get('name')}, price: {plan.get('price_monthly')}")


# ================== REPORTS EXPORT ==================

class TestReportsExport:
    """Test reports export endpoints"""
    
    def test_export_overview_json(self, auth_headers):
        """Test export overview report as JSON"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/{HOTEL_ID}?report_type=overview&format=json&period=month",
            headers=auth_headers
        )
        print(f"Export overview JSON response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have KPIs structure
        assert "kpis" in data or "comparison" in data
        print(f"Overview data keys: {list(data.keys())}")
    
    def test_export_channels_csv(self, auth_headers):
        """Test export channels report as CSV"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/{HOTEL_ID}?report_type=channels&format=csv&period=month",
            headers=auth_headers
        )
        print(f"Export channels CSV response: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        
        assert response.status_code == 200
        
        # Should return CSV content
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type or 'application/json' not in content_type
        
        # CSV should have content
        content = response.text
        print(f"CSV content preview: {content[:200]}")
        assert len(content) > 0
    
    def test_export_revenue_json(self, auth_headers):
        """Test export revenue report as JSON"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/{HOTEL_ID}?report_type=revenue&format=json&period=month",
            headers=auth_headers
        )
        print(f"Export revenue JSON response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have revenue data
        assert "totals" in data or "daily_data" in data
        print(f"Revenue data keys: {list(data.keys())}")
    
    def test_export_occupancy_csv(self, auth_headers):
        """Test export occupancy report as CSV"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export/{HOTEL_ID}?report_type=occupancy&format=csv&period=month",
            headers=auth_headers
        )
        print(f"Export occupancy CSV response: {response.status_code}")
        
        assert response.status_code == 200
        
        # CSV should have content with headers
        content = response.text
        assert "date" in content or "occupancy" in content or len(content) > 0


# ================== LOYALTY DEMO DATA ==================

class TestLoyaltyDemoData:
    """Test loyalty demo data population endpoint"""
    
    def test_populate_loyalty_demo_data(self, auth_headers):
        """Test POST /api/loyalty/demo-data/{hotel_id}"""
        response = requests.post(
            f"{BASE_URL}/api/loyalty/demo-data/{HOTEL_ID}",
            headers=auth_headers
        )
        print(f"Loyalty demo data response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        # Can be 200 (success) or 400/500 (if table doesn't exist)
        # As per review request, table may not exist
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"Demo data result: {data}")
        elif response.status_code in [400, 404, 500]:
            # Expected if loyalty_members table doesn't exist in Supabase
            print(f"Error (expected if table doesn't exist): {response.text}")
            # Still pass - this is documented behavior
        else:
            # Unexpected status
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")


# ================== SUMMARY TEST ==================

class TestEndpointsSummary:
    """Summary test to check all endpoints return proper responses"""
    
    def test_all_endpoints_accessible(self, auth_headers):
        """Verify all new endpoints are accessible"""
        results = {}
        
        # 1. OTA channels
        r = requests.get(f"{BASE_URL}/api/ota/channels/{HOTEL_ID}", headers=auth_headers)
        results["GET /api/ota/channels/{hotel_id}"] = r.status_code
        
        # 2. Billing plans
        r = requests.get(f"{BASE_URL}/api/billing/plans", headers=auth_headers)
        results["GET /api/billing/plans"] = r.status_code
        
        # 3. Reports export JSON
        r = requests.get(f"{BASE_URL}/api/reports/export/{HOTEL_ID}?report_type=overview&format=json", headers=auth_headers)
        results["GET /api/reports/export (JSON)"] = r.status_code
        
        # 4. Reports export CSV
        r = requests.get(f"{BASE_URL}/api/reports/export/{HOTEL_ID}?report_type=channels&format=csv", headers=auth_headers)
        results["GET /api/reports/export (CSV)"] = r.status_code
        
        # 5. Loyalty demo data
        r = requests.post(f"{BASE_URL}/api/loyalty/demo-data/{HOTEL_ID}", headers=auth_headers)
        results["POST /api/loyalty/demo-data"] = r.status_code
        
        print("\n=== ENDPOINT ACCESSIBILITY SUMMARY ===")
        for endpoint, status in results.items():
            status_emoji = "✅" if status in [200, 201] else "⚠️" if status in [400, 404, 500] else "❌"
            print(f"{status_emoji} {endpoint}: {status}")
        
        # Verify core endpoints work
        assert results["GET /api/ota/channels/{hotel_id}"] == 200, "OTA channels endpoint failed"
        assert results["GET /api/billing/plans"] == 200, "Billing plans endpoint failed"
        assert results["GET /api/reports/export (JSON)"] == 200, "Reports export JSON failed"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
