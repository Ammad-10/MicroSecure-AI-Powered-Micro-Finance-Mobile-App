from database import SessionLocal
from models import User
from auth import get_password_hash
from datetime import date

def test_db_operations():
    print("Connecting to database...")
    db = SessionLocal()
    
    test_username = "testuser_db"
    
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.username == test_username).first()
        if existing:
            print(f"User {test_username} already exists. Removing for clean test...")
            db.delete(existing)
            db.commit()

        # Create new user
        print("Creating test user...")
        new_user = User(
            name="Test User",
            father_name="Father Name",
            date_of_birth=date(1995, 1, 1),
            email="test_db@example.com",
            cnic="1234567890123",
            username=test_username,
            password_hash="mock_hash_for_testing",  # Bypassing bcrypt for quick DB check
            face_image_path=None,  # As requested: keep image null
            balance=5000.0
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("\n--- User Created Successfully ---")
        print(f"ID: {new_user.id}")
        print(f"Username: {new_user.username}")
        print(f"Name: {new_user.name}")
        print(f"Balance: {new_user.balance}")
        print(f"Face Image Path: {new_user.face_image_path}")
        print(f"Created At: {new_user.created_at}")
        
        # Read back verification
        print("\nReading user back from DB...")
        user_from_db = db.query(User).filter(User.username == test_username).first()
        if user_from_db:
            print(f"Verification Success! Found user: {user_from_db.name}")
        else:
            print("Verification Failed! User not found.")
            
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_db_operations()
