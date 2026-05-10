import sqlite3
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def check_creds(username, password):
    conn = sqlite3.connect("microfinance.db")
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        print(f"User {username} not found")
        return
    
    hashed = row[0]
    if verify_password(password, hashed):
        print(f"Password for {username} is CORRECT")
    else:
        print(f"Password for {username} is INCORRECT")

if __name__ == "__main__":
    test_user = os.environ.get("TEST_USER", "")
    test_password = os.environ.get("TEST_PASSWORD", "")
    if test_user and test_password:
        check_creds(test_user, test_password)
    else:
        print("TEST_USER or TEST_PASSWORD not set; please set environment variables to run credential checks.")
