import sys
import os
from datetime import date as dt_date, timedelta
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models to ensure full Base.metadata is registered
import app.models
from app.main import app
from app.core.database import get_db, Base

TEST_DB_FILE = os.path.join(os.path.dirname(__file__), "test_vehicules.db")
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


def test_vehicle_crud_lifecycle():
  """Tests the complete Vehicle CRUD lifecycle with validation and archive."""
  # 1. Create a Vehicle
  payload = {
    "immatriculation": "16-554433-00",
    "marque": "Mercedes-Benz",
    "modele": "Intouro",
    "type": "Bus",
    "nombre_places": 55,
    "annee": 2023,
    "date_mise_circulation": "2023-05-10",
    "kilometrage_actuel": 12500.0,
    "statut": "DISPONIBLE",
    "cout_total": 0.0,
  }
  create_res = client.post("/api/v1/vehicules", json=payload)
  assert create_res.status_code == 201, create_res.text
  created = create_res.json()
  vehicule_id = created["id"]
  assert created["immatriculation"] == "16-554433-00"
  assert created["marque"] == "Mercedes-Benz"

  # 2. Reject Duplicate Immatriculation
  dup_res = client.post("/api/v1/vehicules", json=payload)
  assert dup_res.status_code == 400

  # 3. List Vehicles with Search & Filter
  list_res = client.get("/api/v1/vehicules", params={"search": "Intouro"})
  assert list_res.status_code == 200
  data = list_res.json()
  assert data["total"] >= 1
  assert data["items"][0]["modele"] == "Intouro"

  # 4. Update Vehicle
  update_payload = {"kilometrage_actuel": 15200.0, "statut": "MAINTENANCE"}
  update_res = client.put(f"/api/v1/vehicules/{vehicule_id}", json=update_payload)
  assert update_res.status_code == 200
  assert update_res.json()["kilometrage_actuel"] == 15200.0
  assert update_res.json()["statut"] == "MAINTENANCE"

  # 5. Attach Documents with Expiration Calculation
  doc_payload = {
    "nom": "Contrôle Technique Périodique",
    "type": "Contrôle Technique",
    "url_fichier": "/assets/documents/ct_16554433.pdf",
    "date_emission": str(dt_date.today() - timedelta(days=100)),
    "date_expiration": str(dt_date.today() + timedelta(days=15)), # Within 30 days ->Expire bientôt
    "entity_type": "vehicule",
    "entity_id": vehicule_id,
  }
  doc_res = client.post(f"/api/v1/vehicules/{vehicule_id}/documents", json=doc_payload)
  assert doc_res.status_code == 201
  assert doc_res.json()["statut_validite"] == "Expire bientôt"

  # 6. Attach Constat (Accident Report)
  constat_payload = {
    "vehicule_id": vehicule_id,
    "date": str(dt_date.today() - timedelta(days=5)),
    "heure": "11h15",
    "lieu": "Autoroute Est-Ouest, Sortie Bouira",
    "circonstances": "Freinage d'urgence suite à ralentissement imprévu.",
    "dommages": "Pare-chocs avant fissuré, optique gauche intact.",
    "tiers_implique": False,
  }
  constat_res = client.post(f"/api/v1/vehicules/{vehicule_id}/constats", json=constat_payload)
  assert constat_res.status_code == 201
  assert constat_res.json()["lieu"] == "Autoroute Est-Ouest, Sortie Bouira"

  # 7. Get Full Vehicle Detail Dossier
  detail_res = client.get(f"/api/v1/vehicules/{vehicule_id}")
  assert detail_res.status_code == 200
  detail = detail_res.json()
  assert len(detail["documents"]) == 1
  assert len(detail["constats"]) == 1
  assert detail["documents_alertes"] == 1
  assert detail["total_constats"] == 1

  # 8. Archive (Soft-Delete)
  archive_res = client.patch(f"/api/v1/vehicules/{vehicule_id}/archive")
  assert archive_res.status_code == 200
  assert archive_res.json()["statut"] == "HORS_SERVICE"
  assert archive_res.json()["archived_at"] is not None

  # Excluded from active listing by default
  active_list = client.get("/api/v1/vehicules", params={"search": "Intouro"}).json()
  assert active_list["total"] == 0

  # Present when include_archived=True
  archived_list = client.get("/api/v1/vehicules", params={"search": "Intouro", "include_archived": True}).json()
  assert archived_list["total"] == 1

  # Clean up
  if os.path.exists(TEST_DB_FILE):
    try:
      os.remove(TEST_DB_FILE)
    except Exception:
      pass


if __name__ == "__main__":
  test_vehicle_crud_lifecycle()
  print("Vehicle API CRUD and Document/Constat tests passed!")
