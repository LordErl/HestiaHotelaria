#!/usr/bin/env python3

import requests
import json

BACKEND_URL = "https://708dbcce-f0a1-4109-8a30-af2c8fcec6f0.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

def test_key_features():
    """Test the key features mentioned in the review"""
    
    print("🔑 Testing Key Features from Review Requirements")
    print("=" * 60)
    
    results = {
        "isolation": [],
        "b2b_revenue": False,
        "marketplace": [],
        "backend_issues": [],
        "frontend_issues": []
    }
    
    # Test users
    test_users = [
        ("admin@hestia.com", "admin123", "Platform Admin"),
        ("gerente@hotel1.com", "teste123", "Hotel 1 Manager"), 
        ("gerente@hotel2.com", "teste123", "Hotel 2 Manager")
    ]
    
    # Test each user's data isolation
    for email, password, description in test_users:
        print(f"\n🔍 Testing: {description} ({email})")
        
        # Login
        login_response = requests.post(f"{API_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if login_response.status_code != 200:
            print(f"   ❌ Login failed: {login_response.status_code}")
            results["backend_issues"].append(f"Login failed for {email}")
            continue
        
        token = login_response.json()['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test hotel isolation
        hotels_response = requests.get(f"{API_URL}/hotels", headers=headers)
        if hotels_response.status_code == 200:
            hotels = hotels_response.json()
            if "admin" in email:
                print(f"   ✅ Platform admin sees {len(hotels)} hotels")
                results["isolation"].append(f"Admin sees all hotels: {len(hotels)}")
            else:
                if len(hotels) == 1:
                    hotel_name = hotels[0].get('name', 'Unknown')
                    print(f"   ✅ Staff isolated to: {hotel_name}")
                    results["isolation"].append(f"{description} only sees: {hotel_name}")
                else:
                    print(f"   ❌ Staff sees {len(hotels)} hotels (should be 1)")
                    results["backend_issues"].append(f"Data isolation failed for {description}")
        else:
            print(f"   ❌ Hotels API failed: {hotels_response.status_code}")
            results["backend_issues"].append(f"Hotels API failed for {description}")
        
        # Test B2B Revenue Dashboard (only for admin)
        if "admin" in email:
            revenue_response = requests.get(f"{API_URL}/platform/revenue", headers=headers)
            if revenue_response.status_code == 200:
                print(f"   ✅ B2B Revenue Dashboard accessible")
                results["b2b_revenue"] = True
            else:
                print(f"   ❌ B2B Revenue Dashboard failed: {revenue_response.status_code}")
                results["backend_issues"].append("B2B Revenue Dashboard not accessible to admin")
        else:
            # Non-admin should get 403
            revenue_response = requests.get(f"{API_URL}/platform/revenue", headers=headers)
            if revenue_response.status_code == 403:
                print(f"   ✅ B2B Revenue Dashboard correctly restricted")
            else:
                print(f"   ❌ B2B Revenue Dashboard should be restricted (got {revenue_response.status_code})")
                results["backend_issues"].append(f"B2B Revenue Dashboard not properly restricted for {description}")
    
    # Test Guest Marketplace (public endpoint)
    print(f"\n🛒 Testing Guest Marketplace")
    
    marketplace_tests = [
        ("guest/marketplace", "All establishments"),
        ("guest/marketplace?cidade=Rio", "Rio de Janeiro filter"),
        ("guest/marketplace?cidade=São Paulo", "São Paulo filter"),
        ("guest/marketplace?tipo=restaurant", "Restaurant type filter")
    ]
    
    for endpoint, test_name in marketplace_tests:
        response = requests.get(f"{API_URL}/{endpoint}")
        if response.status_code == 200:
            data = response.json()
            partner_count = len(data.get('partners', []))
            print(f"   ✅ {test_name}: {partner_count} establishments")
            results["marketplace"].append(f"{test_name}: {partner_count} establishments")
        else:
            print(f"   ❌ {test_name} failed: {response.status_code}")
            results["backend_issues"].append(f"Marketplace {test_name} failed")
    
    # Print summary
    print(f"\n📋 Test Summary")
    print("=" * 40)
    print(f"✅ Data Isolation: {len(results['isolation'])} scenarios tested")
    for isolation in results['isolation']:
        print(f"   • {isolation}")
    
    print(f"✅ B2B Revenue Dashboard: {'Working' if results['b2b_revenue'] else 'Failed'}")
    
    print(f"✅ Guest Marketplace: {len(results['marketplace'])} scenarios tested")
    for marketplace in results['marketplace']:
        print(f"   • {marketplace}")
    
    if results['backend_issues']:
        print(f"\n❌ Backend Issues Found:")
        for issue in results['backend_issues']:
            print(f"   • {issue}")
    else:
        print(f"\n✅ No critical backend issues found!")
    
    return results

if __name__ == "__main__":
    results = test_key_features()
    print(f"\n🎯 Key Requirements Status:")
    print(f"   Data Isolation: {'✅' if len(results['isolation']) >= 3 and not any('failed' in i.lower() for i in results['backend_issues']) else '❌'}")
    print(f"   B2B Dashboard: {'✅' if results['b2b_revenue'] else '❌'}")
    print(f"   Guest Marketplace: {'✅' if len(results['marketplace']) >= 4 else '❌'}")