import sqlite3
import sys
import os

# Import password hashing from auth.py
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from auth import get_password_hash

def reset_data():
    db_path = "microfinance.db"
    if not os.path.exists(db_path):
        print(f"Error: Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Update all balances to 1000
    print("Updating all user balances to 1000...")
    cursor.execute("UPDATE users SET balance = 1000.0")
    
    # 2. Reset password for test users (use env vars)
    test_password = os.environ.get("TEST_PASSWORD", "")
    test_user = os.environ.get("TEST_USER", "")
    if not test_password or not test_user:
        print("TEST_PASSWORD or TEST_USER not set; skipping user password resets.")
    else:
        hashed_password = get_password_hash(test_password)
        print(f"Resetting password for test user '{test_user}'...")
        cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (hashed_password, test_user))
    
    if cursor.rowcount == 0:
        print("Warning: Test user(s) might not be found in database.")
    else:
        print("Successfully reset passwords.")

    conn.commit()
    conn.close()
    print("Database updates complete.")

if __name__ == "__main__":
    reset_data()
