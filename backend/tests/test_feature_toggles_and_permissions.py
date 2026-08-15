import sys
import os
import uuid
from datetime import date
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
import app.models
from app.main import app

client = TestClient(app)


def test_feature_toggles_admin_crud_and_permission_enforcement():
  # 1. Obtain Tokens
  admin_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "123"})
  assert admin_res.status_code == 200
  admin_token = admin_res.json()["access_token"]
  admin_headers = {"Authorization": f"Bearer {admin_token}"}

  gest_res = client.post("/api/v1/auth/login", json={"username": "gestionnaire", "password": "123"})
  assert gest_res.status_code == 200
  gest_token = gest_res.json()["access_token"]
  gest_headers = {"Authorization": f"Bearer {gest_token}"}

  # 2. Gestionnaire forbidden on admin features listing
  gest_list_res = client.get("/api/v1/admin/features", headers=gest_headers)
  assert gest_list_res.status_code == 403

  # 3. Admin successfully lists all feature toggles
  admin_list_res = client.get("/api/v1/admin/features", headers=admin_headers)
  assert admin_list_res.status_code == 200
  features = admin_list_res.json()["items"]
  assert len(features) >= 20

  # 4. Check active features endpoint
  active_res = client.get("/api/v1/features/active", headers=gest_headers)
  assert active_res.status_code == 200
  assert "create_vehicle"in active_res.json()["features"]

  # 5. Disable 'create_vehicle'feature for Gestionnaire
  disable_res = client.put(
    "/api/v1/admin/features/create_vehicle",
    headers=admin_headers,
    json={"enabled_for_gestionnaire": False},
  )
  assert disable_res.status_code == 200
  assert disable_res.json()["enabled_for_gestionnaire"] is False

  # 6. Verify Gestionnaire is blocked (HTTP 403) when attempting to create a vehicle
  test_immat_1 = f"16-{uuid.uuid4().hex[:6].upper()}-00"
  payload_1 = {
    "immatriculation": test_immat_1,
    "marque": "Mercedes-Benz",
    "modele": "Travego TGL",
    "type": "Bus",
    "nombre_places": 55,
    "annee": 2023,
    "date_mise_circulation": "2023-05-10",
    "kilometrage_actuel": 10000.0,
    "statut": "DISPONIBLE",
    "cout_total": 0.0,
  }

  blocked_res = client.post("/api/v1/vehicules", headers=gest_headers, json=payload_1)
  assert blocked_res.status_code == 403
  assert "Cette fonctionnalité est désactivée par l'administrateur"in blocked_res.json()["detail"]

  # 7. Verify Admin is always allowed (HTTP 201) even when toggle is disabled
  admin_create_res = client.post("/api/v1/vehicules", headers=admin_headers, json=payload_1)
  assert admin_create_res.status_code == 201
  assert admin_create_res.json()["immatriculation"] == test_immat_1

  # 8. Re-enable 'create_vehicle'feature for Gestionnaire
  enable_res = client.put(
    "/api/v1/admin/features/create_vehicle",
    headers=admin_headers,
    json={"enabled_for_gestionnaire": True},
  )
  assert enable_res.status_code == 200
  assert enable_res.json()["enabled_for_gestionnaire"] is True

  # 9. Verify Gestionnaire can now create a vehicle successfully (HTTP 201)
  test_immat_2 = f"16-{uuid.uuid4().hex[:6].upper()}-00"
  payload_2 = {
    "immatriculation": test_immat_2,
    "marque": "Iveco",
    "modele": "Crossway Test",
    "type": "Bus",
    "nombre_places": 50,
    "annee": 2023,
    "date_mise_circulation": "2023-05-10",
    "kilometrage_actuel": 5000.0,
    "statut": "DISPONIBLE",
    "cout_total": 0.0,
  }

  allowed_res = client.post("/api/v1/vehicules", headers=gest_headers, json=payload_2)
  assert allowed_res.status_code == 201
  assert allowed_res.json()["immatriculation"] == test_immat_2


if __name__ == "__main__":
  test_feature_toggles_admin_crud_and_permission_enforcement()
  print("All feature toggle and permission enforcement tests passed!")
