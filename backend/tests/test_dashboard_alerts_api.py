import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models
from app.main import app
from app.core.database import get_db, Base

TEST_DB_FILE = os.path.join(os.path.dirname(__file__), "test_dashboard.db")
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

if os.path.exists(TEST_DB_FILE):
  try:
    os.remove(TEST_DB_FILE)
  except Exception:
    pass

test_engine = create_engine(
  TEST_DATABASE_URL,
  connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
  db = TestingSessionLocal()
  try:
    yield db
  finally:
    db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_dashboard_and_alerts_endpoints():
  # 1. Hit dashboard metrics endpoint
  dash_res = client.get("/api/v1/dashboard")
  assert dash_res.status_code == 200, dash_res.text
  data = dash_res.json()
  assert "kpi"in data
  assert "vehicules"in data["kpi"]
  assert "employes"in data["kpi"]
  assert "partenaires"in data["kpi"]
  assert "contrats"in data["kpi"]
  assert "cautions"in data["kpi"]
  assert "stock"in data["kpi"]
  assert "maintenance"in data["kpi"]

  # 2. Hit global alerts aggregation endpoint
  alerts_res = client.get("/api/v1/alertes")
  assert alerts_res.status_code == 200, alerts_res.text
  alerts_data = alerts_res.json()
  assert "items"in alerts_data
  assert "total"in alerts_data
  assert "urgent_count"in alerts_data
  assert "warning_count"in alerts_data

  # Cleanup
  if os.path.exists(TEST_DB_FILE):
    try:
      os.remove(TEST_DB_FILE)
    except Exception:
      pass


if __name__ == "__main__":
  test_dashboard_and_alerts_endpoints()
  print("Dashboard and alerts tests passed!")
