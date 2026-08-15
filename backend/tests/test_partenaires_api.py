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

TEST_DB_FILE = os.path.join(os.path.dirname(__file__), "test_partenaires.db")
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


def test_partenaire_crm_lifecycle():
  """Tests Single Table Inheritance CRUD for Clients & Fournisseurs, multi-contacts, and CRM notes."""
  # 1. Create a Client with nested Contacts
  client_payload = {
    "nom_commercial": "Sonatrach Exploration & Production",
    "nif": "000016001234567",
    "nis": "000016001234567000",
    "registre_commerce": "16/00-0012345B16",
    "article_imposition": "16010012345",
    "adresse": "Djenane El Malik, Hydra",
    "wilaya": "Alger",
    "telephone_principal": "021 54 70 00",
    "email": "contact@sonatrach.dz",
    "statut_crm": "Actif",
    "role_partenaire": "CLIENT",
    "type_client": "ENTREPRISE",
    "contacts": [
      {
        "nom": "Khelifi",
        "prenom": "Nassim",
        "fonction": "Directeur Logistique & Transport",
        "telephone": "0550 99 88 77",
        "email": "n.khelifi@sonatrach.dz",
        "est_principal": True,
      }
    ],
  }
  res_client = client.post("/api/v1/partenaires", json=client_payload)
  assert res_client.status_code == 201, res_client.text
  client_data = res_client.json()
  client_id = client_data["id"]
  assert client_data["nom_commercial"] == "Sonatrach Exploration & Production"
  assert client_data["role_partenaire"] == "CLIENT"

  # 2. Create a Fournisseur
  fournisseur_payload = {
    "nom_commercial": "Pneumatiques Michelin Algérie SPA",
    "nif": "000316009876543",
    "adresse": "Zone Industrielle Oued Smar",
    "wilaya": "Alger",
    "telephone_principal": "023 92 10 00",
    "statut_crm": "Actif",
    "role_partenaire": "FOURNISSEUR",
    "specialite": "Pneumatiques Poids Lourds & Autocars",
  }
  res_fournisseur = client.post("/api/v1/partenaires", json=fournisseur_payload)
  assert res_fournisseur.status_code == 201, res_fournisseur.text
  fournisseur_data = res_fournisseur.json()
  fournisseur_id = fournisseur_data["id"]
  assert fournisseur_data["role_partenaire"] == "FOURNISSEUR"
  assert fournisseur_data["specialite"] == "Pneumatiques Poids Lourds & Autocars"

  # 3. List and Filter by Role
  clients_only = client.get("/api/v1/partenaires", params={"role_partenaire": "CLIENT"}).json()
  assert all(item["role_partenaire"] == "CLIENT"for item in clients_only["items"])

  # 4. Add additional Contact to Client (1:N test)
  new_contact_payload = {
    "nom": "Boudiaf",
    "prenom": "Yasmine",
    "fonction": "Responsable des Achats & Conventions",
    "telephone": "0661 22 33 44",
    "email": "y.boudiaf@sonatrach.dz",
    "est_principal": False,
  }
  res_contact = client.post(f"/api/v1/partenaires/{client_id}/contacts", json=new_contact_payload)
  assert res_contact.status_code == 201
  assert res_contact.json()["nom"] == "Boudiaf"

  # 5. Log CRM Interaction Note
  note_payload = {
    "type": "Réunion",
    "auteur": "Directeur Commercial",
    "date": str(dt_date.today()),
    "contenu": "Réunion de négociation pour le renouvellement du contrat de transport du personnel 2026/2027.",
  }
  res_note = client.post(f"/api/v1/partenaires/{client_id}/notes", json=note_payload)
  assert res_note.status_code == 201
  assert res_note.json()["type"] == "Réunion"

  # 6. Attach Corporate Document
  doc_payload = {
    "nom": "Extrait du Registre de Commerce 2026",
    "type": "Registre de Commerce",
    "url_fichier": "/assets/documents/rc_sonatrach.pdf",
    "date_emission": "2026-01-01",
    "entity_type": "partenaire",
    "entity_id": client_id,
  }
  res_doc = client.post(f"/api/v1/partenaires/{client_id}/documents", json=doc_payload)
  assert res_doc.status_code == 201

  # 7. Get Full Partner Detail Dossier
  detail_res = client.get(f"/api/v1/partenaires/{client_id}")
  assert detail_res.status_code == 200
  detail = detail_res.json()
  assert detail["total_contacts"] == 2
  assert detail["total_notes"] == 1
  assert detail["total_documents"] == 1
  assert detail["contact_principal"] is not None
  assert detail["contact_principal"]["nom"] == "Khelifi"

  # 8. Archive Partner
  archive_res = client.patch(f"/api/v1/partenaires/{client_id}/archive")
  assert archive_res.status_code == 200
  assert archive_res.json()["statut_crm"] == "Inactif"
  assert archive_res.json()["archived_at"] is not None

  # Clean up test db
  if os.path.exists(TEST_DB_FILE):
    try:
      os.remove(TEST_DB_FILE)
    except Exception:
      pass


if __name__ == "__main__":
  test_partenaire_crm_lifecycle()
  print("Partner CRM API tests passed!")
