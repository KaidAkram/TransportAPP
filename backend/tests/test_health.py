import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
  response = client.get("/")
  assert response.status_code == 200
  data = response.json()
  assert data["app"] == "E-Transport ERP API"
  assert data["health"] == "/health"


def test_health_root_endpoint():
  response = client.get("/health")
  assert response.status_code == 200
  data = response.json()
  assert data["status"] == "ok"
  assert data["app"] == "E-Transport ERP API"
  assert "database"in data


def test_health_api_v1_endpoint():
  response = client.get("/api/v1/health")
  assert response.status_code == 200
  data = response.json()
  assert data["status"] == "ok"
  assert data["version"] == "1.0.0"


if __name__ == "__main__":
  test_root_endpoint()
  test_health_root_endpoint()
  test_health_api_v1_endpoint()
  print("All health tests passed successfully!")
