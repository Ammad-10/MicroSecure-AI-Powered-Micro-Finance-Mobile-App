import sqlite3
import pandas as pd

def inspect_database(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("Tables in database:")
    for table_name in tables:
        name = table_name[0]
        print(f"\n--- Table: {name} ---")
        
        # Get schema
        cursor.execute(f"PRAGMA table_info({name});")
        columns = cursor.fetchall()
        print("Columns:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            
        # Preview data
        try:
            df = pd.read_sql_query(f"SELECT * FROM {name}", conn)
            print("\nFull Data:")
            print(df.to_string(index=False))
        except Exception as e:
            print(f"Could not read data from {name}: {e}")
            # Fallback if pandas is not available
            cursor.execute(f"SELECT * FROM {name}")
            rows = cursor.fetchall()
            for row in rows:
                print(row)
    
    conn.close()

if __name__ == "__main__":
    inspect_database("microfinance.db")
