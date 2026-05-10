import urllib.request
import urllib.error
import json
import sqlite3
import os

URL = "http://localhost:8001/api/auth/signup"
DATA = {
    "name": "Demo User",
    "father_name": "Demo Father",
    "date_of_birth": "1990-01-01",
    "email": os.environ.get("TEST_EMAIL", "demo@example.com"),
    "cnic": os.environ.get("TEST_CNIC", "0000000000000"),
    "username": os.environ.get("TEST_USER", "demouser"),
    "password": os.environ.get("TEST_PASSWORD", ""),
    "face_image": "dnVsa2Fu" # Base64 for 'vulkan'
}

print("--- 1. CREATING DEMO USER ---")
try:
    req = urllib.request.Request(URL, data=json.dumps(DATA).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        print(f"User Created: {response.getcode()}")
        print(f"Response: {response.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Creation Failed (might already exist): {e.code}")
    print(f"Reason: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")

print("\n--- 2. UPDATING BALANCE TO 50,000 ---")
try:
    conn = sqlite3.connect('microfinance.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET balance = 50000.0 WHERE username = ?", (DATA["username"],))
    conn.commit()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (DATA["username"],))
    user = cursor.fetchone()
    print(f"User Updated: {user}")
    conn.close()
except Exception as e:
    print(f"DB Error: {e}")
