#!/usr/bin/env python3

import requests
import sys
import json

BACKEND_URL = "https://708dbcce-f0a1-4109-8a30-af2c8fcec6f0.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

def test_admin_access():
    """Test platform admin access"""
    print("Testing admin access...")
    
    # Login as admin
    login_response = requests.post(f"{API_URL}/auth/login", json={
        "email": "admin@hestia.com",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
        return False
    
    login_data = login_response.json()
    token = login_data['access_token']
    user = login_data.get('user', {})
    
    print(f"✅ Login successful")
    print(f"   User: {user.get('name')} ({user.get('email')})")
    print(f"   Role: {user.get('role')}")
    print(f"   is_platform_admin: {user.get('is_platform_admin')}")
    print(f"   Hotel ID: {user.get('hotel_id')}")
    
    # Test /auth/me to see current user details
    me_response = requests.get(f"{API_URL}/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    
    if me_response.status_code == 200:
        me_data = me_response.json()
        print(f"\n/auth/me response:")
        print(f"   is_platform_admin: {me_data.get('is_platform_admin')}")
        print(f"   email: {me_data.get('email')}")
        print(f"   role: {me_data.get('role')}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test platform endpoints
    endpoints = [
        "/platform/revenue",
        "/platform/dashboard", 
        "/platform/hotels",
        "/platform/users",
        "/platform/organizations"
    ]
    
    for endpoint in endpoints:
        response = requests.get(f"{API_URL}{endpoint}", headers=headers)
        if response.status_code == 200:
            print(f"✅ {endpoint} - Success")
        else:
            print(f"❌ {endpoint} - {response.status_code}: {response.text}")

if __name__ == "__main__":
    test_admin_access()