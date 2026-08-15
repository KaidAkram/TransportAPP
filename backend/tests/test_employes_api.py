import sys
import os
from datetime import date as dt_date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models to ensure metadata is registered
import app.models
from app.main import app
from app.core.database import get_db, Base

TEST_DB_FILE = os.path.join(os.path.dirname(__file__), "test_employes.db")
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


def test_employe_polymorphic_crud_lifecycle():
  """Tests Single Table Inheritance CRUD for Chauffeurs and Mecaniciens."""
  # 1. Create a Chauffeur with attached Permis
  chauffeur_payload = {
    "matricule": "CH-100",
    "nom": "Larbi",
    "prenom": "Karim",
    "photo": "/assets/avatars/driver_pro.jpg",
    "date_naissance": "1985-06-20",
    "telephone": "0551 23 45 67",
    "adresse": "Centre Ville, Blida",
    "date_embauche": "2020-02-01",
    "statut": "ACTIF",
    "type_employe": "CHAUFFEUR",
    "fonction": "Chauffeur Grand Tourisme",
    "assurance": True,
    "permis_numero": "DZ-09-554433",
    "permis_categories": "B, D, D1",
    "permis_date_obtention": "2010-05-15",
    "permis_date_expiration": str(dt_date.today() + timedelta(days=20)), # Expire bientôt
    "permis_scan": "/assets/documents/permis_ch100.pdf",
  }
  res_ch = client.post("/api/v1/employes", json=chauffeur_payload)
  assert res_ch.status_code == 201, res_ch.text
  ch_data = res_ch.json()
  ch_id = ch_data["id"]
  assert ch_data["matricule"] == "CH-100"
  assert ch_data["type_employe"] == "CHAUFFEUR"
  assert ch_data["assurance"] is True

  # 2. Create a Mecanicien
  mecanicien_payload = {
    "matricule": "MEC-200",
    "nom": "Touati",
    "prenom": "Samir",
    "photo": "/assets/avatars/mechanic_pro.jpg",
    "date_naissance": "1990-11-10",
    "telephone": "0660 77 88 99",
    "adresse": "Zone Industrielle Rouiba, Alger",
    "date_embauche": "2021-09-15",
    "statut": "ACTIF",
    "type_employe": "MECANICIEN",
    "fonction": "Électromécanicien Poids Lourds",
    "specialite": "Électricité & Diagnostic Électronique",
    "type_mecanicien": "Technicien Supérieur",
    "experience": "8 ans",
    "est_responsable": True,
  }
  res_mec = client.post("/api/v1/employes", json=mecanicien_payload)
  assert res_mec.status_code == 201, res_mec.text
  mec_data = res_mec.json()
  mec_id = mec_data["id"]
  assert mec_data["matricule"] == "MEC-200"
  assert mec_data["type_employe"] == "MECANICIEN"
  assert mec_data["specialite"] == "Électricité & Diagnostic Électronique"
  assert mec_data["est_responsable"] is True

  # 3. Reject Duplicate Matricule
  dup_res = client.post("/api/v1/employes", json=chauffeur_payload)
  assert dup_res.status_code == 400

  # 4. Filter by Type (STI check)
  chauffeurs_only = client.get("/api/v1/employes", params={"type_employe": "CHAUFFEUR"}).json()
  assert all(item["type_employe"] == "CHAUFFEUR"for item in chauffeurs_only["items"])

  mecaniciens_only = client.get("/api/v1/employes", params={"type_employe": "MECANICIEN"}).json()
  assert all(item["type_employe"] == "MECANICIEN"for item in mecaniciens_only["items"])

  # 5. Check Driver's License Sub-resource & Expiration Calculation
  permis_res = client.get(f"/api/v1/employes/{ch_id}/permis")
  assert permis_res.status_code == 200
  permis_info = permis_res.json()
  assert permis_info["numero"] == "DZ-09-554433"
  assert permis_info["statut_validite"] == "Expire bientôt"

  # 6. Attach Generic Administrative Document to Employee
  doc_payload = {
    "nom": "Carte Nationale d'Identité Biométrique",
    "type": "CNI",
    "url_fichier": "/assets/documents/cni_ch100.pdf",
    "date_emission": "2020-01-10",
    "date_expiration": str(dt_date.today() + timedelta(days=365)), # Valide
    "entity_type": "employe",
    "entity_id": ch_id,
  }
  doc_res = client.post(f"/api/v1/employes/{ch_id}/documents", json=doc_payload)
  assert doc_res.status_code == 201
  assert doc_res.json()["statut_validite"] == "Valide"

  # 7. Get Full Employee Detail Dossier
  detail_res = client.get(f"/api/v1/employes/{ch_id}")
  assert detail_res.status_code == 200
  detail = detail_res.json()
  assert detail["permis"] is not None
  assert detail["permis"]["numero"] == "DZ-09-554433"
  assert len(detail["documents"]) == 1
  assert detail["documents_valides"] == 1

  # 8. Archive (Soft-delete) Employee
  archive_res = client.patch(f"/api/v1/employes/{ch_id}/archive")
  assert archive_res.status_code == 200
  assert archive_res.json()["statut"] == "QUITTE"
  assert archive_res.json()["archived_at"] is not None

  # Clean up test database
  if os.path.exists(TEST_DB_FILE):
    try:
      os.remove(TEST_DB_FILE)
    except Exception:
      pass


if __name__ == "__main__":
  test_employe_polymorphic_crud_lifecycle()
  print("Employee STI CRUD and Permis/Document tests passed!")
