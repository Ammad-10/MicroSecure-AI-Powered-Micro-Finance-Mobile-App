"""
Quick script to drop and recreate tables in-place.
Works even when the DB file is locked (e.g. by VS Code).
"""
from database import engine, Base
from models import User, Transaction
from sqlalchemy import text, inspect

# Check current state 
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Current tables: {tables}")

if "transactions" in tables:
    # Check if FK already exists
    fks = inspector.get_foreign_keys("transactions")
    if fks:
        print(f"FK constraint already exists: {fks}")
        print("No migration needed!")
    else:
        print("No FK constraint found. Recreating tables...")
        
        # Drop all tables and recreate
        Base.metadata.drop_all(bind=engine)
        print("Dropped all tables.")
        
        Base.metadata.create_all(bind=engine)
        print("Recreated all tables with FK constraints.")
else:
    print("No tables found. Creating fresh...")
    Base.metadata.create_all(bind=engine)
    print("Created all tables.")

# Verify
print("\n--- Verification ---")
with engine.connect() as conn:
    # Check FK pragma
    result = conn.execute(text("PRAGMA foreign_keys"))
    fk_status = result.fetchone()[0]
    print(f"Foreign keys enabled: {bool(fk_status)}")
    
    # Check transactions schema
    result = conn.execute(text("SELECT sql FROM sqlite_master WHERE name='transactions'"))
    row = result.fetchone()
    if row:
        print(f"\nTransactions table DDL:\n{row[0]}")
    
    # Check users schema
    result = conn.execute(text("SELECT sql FROM sqlite_master WHERE name='users'"))
    row = result.fetchone()
    if row:
        print(f"\nUsers table DDL:\n{row[0]}")

print("\nMigration complete!")
