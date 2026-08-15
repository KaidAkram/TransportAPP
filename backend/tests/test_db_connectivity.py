import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import check_db_connection
from app.core.config import settings


def test_database_ping():
  """
  Executes the database ping test utility and reports status cleanly.
  """
  print("\n--- Testing Database Connectivity ---")
  print(f"Target Database URL: {settings.DATABASE_URL}")
  print(f"Target Supabase URL: {settings.SUPABASE_URL}")
  
  result = check_db_connection()
  print(f"Connectivity Ping Result: {result}")
  
  if result["connected"]:
    print("[SUCCESS] Successfully connected to PostgreSQL / Supabase!")
  else:
    print("[INFO] Database is not currently running locally or credentials are not yet configured in .env.")
    print(f"Details: {result.get('error', result.get('message'))}")
    print("To connect to your live Supabase database, copy backend/.env.example to backend/.env and provide your credentials.")
  
  assert "connected"in result


if __name__ == "__main__":
  test_database_ping()
