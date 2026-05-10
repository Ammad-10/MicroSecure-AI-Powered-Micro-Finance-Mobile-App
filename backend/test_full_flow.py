import time
import urllib.request
import urllib.error
import json
import sqlite3
import sys
import os

URL_HEALTH = "http://localhost:8001/api/health"
URL_SIGNUP = "http://localhost:8001/api/auth/signup"

DATA = {
    "name": "Restart User",
    "father_name": "Restart Father",
    "date_of_birth": "2000-01-01",
    "email": os.environ.get("TEST_EMAIL", "restart@example.com"),
    "cnic": os.environ.get("TEST_CNIC", "7777777777777"),
    "username": os.environ.get("TEST_USER", "restartuser"),
    "password": os.environ.get("TEST_PASSWORD", ""),
    "face_image": "dnVsa2Fu"
}

def wait_for_server():
    print("Waiting for server to start...")
    for i in range(30):
        try:
            with urllib.request.urlopen(URL_HEALTH, timeout=1) as response:
                if response.getcode() == 200:
                    print("\nServer is up!")
                    return True
        except:
            time.sleep(1)
            print(".", end="", flush=True)
    return False

def create_user():
    print("\n--- CREATING USER ---")
    try:
        req = urllib.request.Request(URL_SIGNUP, data=json.dumps(DATA).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.getcode()}")
            print(f"Response: {response.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"Failed: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"Error: {e}")

def check_db():
    print("\n--- CHECKING DATABASE (Table: users) ---")
    try:
        conn = sqlite3.connect('microfinance.db')
        cursor = conn.cursor()
        rows = cursor.execute('SELECT * FROM users').fetchall()
        if not rows:
            print("No users found.")
        else:
            for row in rows:
                print(row)
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    if wait_for_server():
        create_user()
        check_db()
    else:
        print("\nServer failed to start.")
