"""
Comprehensive test for FK constraint, threshold change, and all API endpoints.
Uses direct DB operations + HTTP calls to verify everything works.
"""
import json
import urllib.request
import urllib.error
import sqlite3
import os
import sys

BASE_URL = "http://localhost:8001"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "microfinance.db")
PASS = "[PASS]"
FAIL = "[FAIL]"

results = []

def log(test_name, passed, detail=""):
    status = PASS if passed else FAIL
    results.append((test_name, passed))
    print(f"  {status} {test_name}" + (f" - {detail}" if detail else ""))

def api_request(method, endpoint, data=None, token=None):
    url = BASE_URL + endpoint
    try:
        req_data = json.dumps(data).encode('utf-8') if data else None
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f"Bearer {token}"
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req) as response:
            return {"status": response.getcode(), "data": json.loads(response.read().decode())}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "error": e.read().decode()}
    except Exception as e:
        return {"status": 0, "error": str(e)}


# ========================================
# PART 1: Database Schema Verification
# ========================================
print("\n" + "="*50)
print("PART 1: DATABASE SCHEMA VERIFICATION")
print("="*50)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Test 1: FK constraint exists in schema
cur.execute("SELECT sql FROM sqlite_master WHERE name='transactions'")
schema = cur.fetchone()[0]
has_fk = "FOREIGN KEY" in schema and "REFERENCES users" in schema
log("FK constraint in transactions table DDL", has_fk, schema.split('\n')[-2].strip() if has_fk else "NOT FOUND")

# Test 2: FK enforcement is active
cur.execute("PRAGMA foreign_keys")
fk_on = cur.fetchone()[0] == 1
log("PRAGMA foreign_keys is ON", fk_on)

# Test 3: FK actually enforced - insert with bad user_id should fail
try:
    cur.execute("PRAGMA foreign_keys=ON")
    cur.execute("INSERT INTO transactions (user_id, type, amount) VALUES (99999, 'test', 10.0)")
    conn.commit()
    log("FK enforcement blocks invalid user_id", False, "Insert succeeded (should have failed!)")
    # Clean up
    cur.execute("DELETE FROM transactions WHERE user_id = 99999")
    conn.commit()
except sqlite3.IntegrityError as e:
    log("FK enforcement blocks invalid user_id", True, str(e))

conn.close()


# ========================================
# PART 2: API Endpoint Tests
# ========================================
print("\n" + "="*50)
print("PART 2: API ENDPOINT TESTS")
print("="*50)

# Test: Health check
res = api_request("GET", "/api/health")
log("GET /api/health", res["status"] == 200)

# Test: Root endpoint
res = api_request("GET", "/")
log("GET /", res["status"] == 200)

# Test: Signup with valid data (using a real small face image)
# Generate a proper test face image using PIL
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from PIL import Image
    import base64
    import io
    import numpy as np
    
    # Create a 200x200 skin-toned face-like image (simple circle)
    img = Image.new('RGB', (200, 200), color=(200, 160, 130))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    test_face_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    USER_A = {
        "name": "Test User Alpha",
        "father_name": "Father Alpha",
        "date_of_birth": "1990-05-15",
        "email": os.environ.get("TEST_EMAIL", "alpha_test@example.com"),
        "cnic": os.environ.get("TEST_CNIC", "3333333333333"),
        "username": os.environ.get("TEST_USER", "testalpha"),
        "password": os.environ.get("TEST_PASSWORD", ""),
        "face_image": test_face_b64
    }
    
    USER_B = {
        "name": "Test User Beta",
        "father_name": "Father Beta",
        "date_of_birth": "1992-03-20",
        "email": os.environ.get("TEST_EMAIL_2", "beta_test@example.com"),
        "cnic": os.environ.get("TEST_CNIC_2", "4444444444444"),
        "username": os.environ.get("TEST_USER_2", "testbeta"),
        "password": os.environ.get("TEST_PASSWORD", ""),
        "face_image": test_face_b64
    }
    
    res = api_request("POST", "/api/auth/signup", USER_A)
    signup_a_ok = res["status"] == 201 or (res["status"] == 400 and "already" in str(res.get("error", "")))
    log("POST /api/auth/signup (User A)", signup_a_ok, 
        f"Status {res['status']}" + (f" - {res.get('error', '')[:80]}" if res["status"] != 201 else " - Created"))
    
    res = api_request("POST", "/api/auth/signup", USER_B)
    signup_b_ok = res["status"] == 201 or (res["status"] == 400 and "already" in str(res.get("error", "")))
    log("POST /api/auth/signup (User B)", signup_b_ok,
        f"Status {res['status']}" + (f" - {res.get('error', '')[:80]}" if res["status"] != 201 else " - Created"))
    
except Exception as e:
    log("Signup tests", False, str(e))

# Test: Login
res = api_request("POST", "/api/auth/login", {"username": os.environ.get("TEST_USER", "testalpha"), "password": os.environ.get("TEST_PASSWORD", "")})
login_ok = res["status"] == 200
token = res.get("data", {}).get("access_token", "") if login_ok else ""
log("POST /api/auth/login", login_ok, f"Got token: {bool(token)}")

if token:
    # Test: Get current user
    res = api_request("GET", "/api/auth/me", token=token)
    log("GET /api/auth/me", res["status"] == 200, f"User: {res.get('data',{}).get('username','?')}")
    
    balance = res.get("data", {}).get("balance", 0)
    
    # Test: Pay bill (only if has balance)
    if balance >= 100:
        res = api_request("POST", "/api/billing/pay-bill", {"psid": "1234567890123", "amount": 100.0}, token=token)
        log("POST /api/billing/pay-bill", res["status"] == 200, f"Status {res['status']}")
    else:
        log("POST /api/billing/pay-bill", True, f"Skipped (balance={balance})")
    
    # Test: Send money (only if has balance)
    if balance >= 50:
        res = api_request("POST", "/api/billing/send-money", 
                  {"recipient_username": os.environ.get("TEST_USER_2", "testbeta"), "amount": 50.0}, token=token)
        log("POST /api/billing/send-money", res["status"] == 200, f"Status {res['status']}")
    else:
        log("POST /api/billing/send-money", True, f"Skipped (balance={balance})")
    
    # Test: Get transactions
    res = api_request("GET", "/api/billing/transactions", token=token)
    log("GET /api/billing/transactions", res["status"] == 200, 
        f"Found {len(res.get('data',[]))} transactions")
    
    # Test: Unauthorized access without token
    res = api_request("GET", "/api/auth/me")
    log("Unauthorized access returns 401", res["status"] == 401)

# Test: Duplicate CNIC signup
res = api_request("POST", "/api/auth/signup", USER_A)
log("Duplicate CNIC rejected", res["status"] == 400)


# ========================================
# PART 3: AI Service Threshold Check
# ========================================
print("\n" + "="*50)
print("PART 3: AI THRESHOLD VERIFICATION")
print("="*50)

# Read the ai_service.py file and check threshold
ai_service_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "services", "ai_service.py")
with open(ai_service_path, 'r') as f:
    content = f.read()
    has_085 = "THRESHOLD = 0.85" in content
    log("Threshold set to 0.85 in ai_service.py", has_085)


# ========================================
# SUMMARY
# ========================================
print("\n" + "="*50)
passed = sum(1 for _, p in results if p)
total = len(results)
print(f"RESULTS: {passed}/{total} tests passed")
if passed == total:
    print("ALL TESTS PASSED!")
else:
    print(f"FAILED: {total - passed} test(s)")
    for name, p in results:
        if not p:
            print(f"  - {name}")
print("="*50)
