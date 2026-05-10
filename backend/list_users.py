
import sqlite3

def list_users():
    conn = sqlite3.connect('microfinance.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email FROM users")
    users = cursor.fetchall()
    print("--- Users in Database ---")
    for user in users:
        print(f"ID: {user[0]}, Username: {user[1]}, Email: {user[2]}")
    conn.close()

if __name__ == "__main__":
    list_users()
