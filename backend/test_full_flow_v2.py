import time
import urllib.request
import urllib.error
import urllib.parse
import json
import base64
import os
import sys

# Configuration
BASE_URL = "http://localhost:8001"
HEADERS = {'Content-Type': 'application/json'}

# Test Data
# Using a small red square as a dummy "face image" (base64)
# In a real test, this would be a real face, but for backend logic flow, any base64 string works 
# unless FaceNet rejects it. 
# Providing a REAL face image base64 is better. 
# I will use a very small valid JPG base64.
# This 1x1 pixel white image.
TEST_IMAGE_B64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="

USER_1 = {
    "name": "Test User A",
    "father_name": "Father A",
    "date_of_birth": "1990-01-01",
    "email": os.environ.get("TEST_EMAIL", "userA@example.com"),
    "cnic": os.environ.get("TEST_CNIC", "1111111111111"),
    "username": os.environ.get("TEST_USER", "usera"),
    "password": os.environ.get("TEST_PASSWORD", ""),
    "face_image": TEST_IMAGE_B64
}

USER_2 = {
    "name": "Test User B",
    "father_name": "Father B",
    "date_of_birth": "1992-02-02",
    "email": os.environ.get("TEST_EMAIL_2", "userB@example.com"),
    "cnic": os.environ.get("TEST_CNIC_2", "2222222222222"),
    "username": os.environ.get("TEST_USER_2", "userb"),
    "password": os.environ.get("TEST_PASSWORD", ""),
    "face_image": TEST_IMAGE_B64
}

def request(method, endpoint, data=None, token=None):
    url = BASE_URL + endpoint
    try:
        req_data = json.dumps(data).encode('utf-8') if data else None
        headers = HEADERS.copy()
        if token:
            headers['Authorization'] = f"Bearer {token}"
            
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return {"status": response.getcode(), "data": result}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"FAILED {method} {endpoint}: {e.code} - {error_body}")
        return {"status": e.code, "error": error_body}
    except Exception as e:
        print(f"ERROR {method} {endpoint}: {str(e)}")
        return {"status": 500, "error": str(e)}

def run_tests():
    print(f"--- STARTING FULL FLOW TEST ---")
    
    # 1. Signup User A
    print("\n[Signup User A]")
    res_signup_a = request("POST", "/api/auth/signup", USER_1)
    if res_signup_a['status'] == 200:
        print("Success: User A Created")
    elif "already exists" in str(res_signup_a):
        print("User A already exists (Expected on re-run)")
    else:
        print("Failed to Signup A")

    # 2. Signup User B
    print("\n[Signup User B]")
    res_signup_b = request("POST", "/api/auth/signup", USER_2)
    if res_signup_b['status'] == 200:
        print("Success: User B Created")
    elif "already exists" in str(res_signup_b):
        print("User B already exists")

    # 3. Login User A
    print("\n[Login User A]")
    # Login expects form-data usually for OAuth2, but let's see implementation.
    # Ah, implementation might be JSON or Form. 
    # Let's check `auth.py`. 
    # FastAPI `OAuth2PasswordRequestForm` usually takes form data login.
    # But let's try JSON first as `request` helper does JSON.
    # Actually, `api.js` login uses JSON: `/api/auth/login`.
    res_login = request("POST", "/api/auth/login", {
        "username": USER_1["username"],
        "password": USER_1["password"]
    })
    
    if res_login['status'] != 200:
        print("FATAL: Login failed")
        return

    TOKEN_A = res_login['data']['access_token']
    print(f"Success: Got Token for User A")
    
    # 4. Get Dashboard (Check Balance)
    print("\n[Get User A Dashboard]")
    res_me = request("GET", "/api/auth/me", token=TOKEN_A)
    print(f"User Balance: {res_me['data']['balance']}")
    
    # 5. Pay Bill
    print("\n[User A Pays Bill]")
    res_bill = request("POST", "/api/billing/pay-bill", {
        "psid": "1234567890123",
        "amount": 500.0
    }, token=TOKEN_A)
    print(f"Bill Payment Status: {res_bill['status']}")
    
    # 6. Verify Transaction (Simulation)
    # This step is CRITICAL. It calls the AI service. 
    # We send the SAME image we signed up with, so distance should be 0.0 -> Verified.
    print("\n[User A Verifies Face for Transaction]")
    res_verify = request("POST", "/api/billing/verify-transaction", {
        "cnic": USER_1["cnic"],
        "face_image": TEST_IMAGE_B64
    }, token=TOKEN_A)
    
    if res_verify['status'] == 200 and res_verify['data']['verified']:
        print(f"Verification Success! Distance: {res_verify['data']['distance']}")
    else:
        print(f"Verification FAILED: {res_verify}")

    # 7. Send Money (A -> B)
    # Only if verification passed
    print("\n[User A Sends Money to User B]")
    res_send = request("POST", "/api/billing/send-money", {
        "recipient_username": USER_2["username"],
        "amount": 200.0
    }, token=TOKEN_A)
    
    if res_send['status'] == 200:
        print(f"Transfer Success! New Balance: {request('GET', '/api/auth/me', token=TOKEN_A)['data']['balance']}")
    else:
        print(f"Transfer Failed: {res_send}")

    # 8. Check Transactions
    print("\n[Check User A Transactions]")
    res_tx = request("GET", "/api/billing/transactions", token=TOKEN_A)
    print(f"Found {len(res_tx['data'])} transactions.")
    for tx in res_tx['data'][:3]:
        print(f" - {tx['type']}: {tx['amount']}")

if __name__ == "__main__":
    run_tests()
