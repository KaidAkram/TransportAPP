import sys
import os
from datetime import date as dt_date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models
import app.models
from app.main import app
from app.core.database import get_db, Base

TEST_DB_FILE = os.path.join(os.path.dirname(__file__), "test_stock.db")
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


def test_stock_and_maintenance_transactional_sync():
  """Tests Spare Parts inventory, stock entries, physical audits, and automatic stock deduction during maintenance."""
  # 1. Create a Spare Part: Jeu Plaquettes de Frein (FRE-002)
  piece_payload = {
    "reference": "FRE-002",
    "designation": "Jeu Plaquettes de frein avant Knorr-Bremse",
    "categorie": "Freinage",
    "marque": "Knorr-Bremse",
    "unite": "Jeu",
    "stock_actuel": 6,
    "stock_minimum": 5,
    "emplacement": "B-01-04",
  }
  p_res = client.post("/api/v1/stock/pieces", json=piece_payload)
  assert p_res.status_code == 201, p_res.text
  piece_id = p_res.json()["id"]
  assert p_res.json()["stock_actuel"] == 6
  assert p_res.json()["statut_stock"] == "NORMAL"

  # 2. Register a Supplier Delivery (Entrée de stock +4)
  entry_payload = {
    "piece_id": piece_id,
    "quantite": 4,
    "date": str(dt_date.today()),
    "motif": "Réception commande réapprovisionnement",
    "reference_document": "BL-2026-089",
  }
  ent_res = client.post("/api/v1/stock/entrees", json=entry_payload)
  assert ent_res.status_code == 201
  
  # Verify stock increased to 10
  piece_after_ent = client.get(f"/api/v1/stock/pieces/{piece_id}").json()
  assert piece_after_ent["stock_actuel"] == 10
  assert piece_after_ent["total_entrees"] == 4

  # 3. Create a Vehicle & Mechanic
  veh_payload = {
    "immatriculation": "16-123456-00",
    "marque": "Mercedes-Benz",
    "modele": "Tourismo",
    "type": "Bus",
    "nombre_places": 49,
    "annee": 2022,
    "date_mise_circulation": "2022-03-15",
    "kilometrage_actuel": 245000.0,
    "statut": "DISPONIBLE",
  }
  v_res = client.post("/api/v1/vehicules", json=veh_payload)
  assert v_res.status_code == 201
  vehicule_id = v_res.json()["id"]

  mec_payload = {
    "matricule": "MEC-001",
    "nom": "Brahimi",
    "prenom": "Ahmed",
    "telephone": "0661 98 76 54",
    "date_embauche": "2015-03-01",
    "type_employe": "MECANICIEN",
    "specialite": "Chef d'Atelier",
    "type_mecanicien": "Chef d'Atelier",
  }
  m_res = client.post("/api/v1/employes", json=mec_payload)
  assert m_res.status_code == 201
  mecanicien_id = m_res.json()["id"]

  # 4. Perform Maintenance Intervention on Vehicle consuming 2 brake pads
  inter_payload = {
    "numero": "INT-2026-001",
    "vehicule_id": vehicule_id,
    "mecanicien_responsable_id": mecanicien_id,
    "type": "PREVENTIVE",
    "categorie": "Freinage & Révision",
    "date": str(dt_date.today()),
    "kilometrage": 245820.0,
    "probleme_constate": "Contrôle périodique freinage.",
    "travail_effectue": "Remplacement jeu complet plaquettes avant.",
    "cout_total": 45000.0,
    "statut": "TERMINEE",
    "pieces_utilisees": [
      {
        "piece_id": piece_id,
        "quantite": 2,
      }
    ],
  }
  int_res = client.post("/api/v1/interventions", json=inter_payload)
  assert int_res.status_code == 201, int_res.text
  int_id = int_res.json()["id"]

  # Assert stock dropped from 10 to 8
  piece_after_int = client.get(f"/api/v1/stock/pieces/{piece_id}").json()
  assert piece_after_int["stock_actuel"] == 8
  assert piece_after_int["total_sorties"] == 2
  assert piece_after_int["statut_stock"] == "NORMAL"

  # Assert intervention details contain consumed piece
  int_detail = client.get(f"/api/v1/interventions/{int_id}").json()
  assert int_detail["total_pieces_utilisees"] == 2
  assert int_detail["pieces_consommees"][0]["reference"] == "FRE-002"

  # 5. Perform another intervention consuming 4 units ->triggers LOW STOCK ALERT (FAIBLE)
  inter_payload_2 = {
    "numero": "INT-2026-002",
    "vehicule_id": vehicule_id,
    "mecanicien_responsable_id": mecanicien_id,
    "type": "CORRECTIVE",
    "categorie": "Freinage",
    "date": str(dt_date.today()),
    "kilometrage": 246000.0,
    "probleme_constate": "Usure accélérée.",
    "cout_total": 80000.0,
    "statut": "TERMINEE",
    "pieces_utilisees": [
      {
        "piece_id": piece_id,
        "quantite": 4,
      }
    ],
  }
  int_res_2 = client.post("/api/v1/interventions", json=inter_payload_2)
  assert int_res_2.status_code == 201

  # Assert stock dropped from 8 to 4 and status is FAIBLE (4 <= 5)
  piece_after_int_2 = client.get(f"/api/v1/stock/pieces/{piece_id}").json()
  assert piece_after_int_2["stock_actuel"] == 4
  assert piece_after_int_2["statut_stock"] == "FAIBLE"

  # 6. Test Shortage Rejection: Attempt to consume 10 units when only 4 exist
  inter_payload_shortage = {
    "numero": "INT-2026-SHORTAGE",
    "vehicule_id": vehicule_id,
    "categorie": "Freinage",
    "date": str(dt_date.today()),
    "kilometrage": 246100.0,
    "statut": "EN_COURS",
    "pieces_utilisees": [
      {
        "piece_id": piece_id,
        "quantite": 10,
      }
    ],
  }
  res_shortage = client.post("/api/v1/interventions", json=inter_payload_shortage)
  assert res_shortage.status_code == 400
  assert "Stock insuffisant"in res_shortage.text

  # 7. Physical Inventory Audit Adjustment
  audit_payload = {
    "piece_id": piece_id,
    "stock_reel_compte": 7,
    "date": str(dt_date.today()),
    "motif": "Inventaire semestriel",
    "justification_ecart": "Retrouvé 3 jeux non scannés au rayon B-01",
  }
  audit_res = client.post("/api/v1/stock/inventaire", json=audit_payload)
  assert audit_res.status_code == 201
  
  piece_after_audit = client.get(f"/api/v1/stock/pieces/{piece_id}").json()
  assert piece_after_audit["stock_actuel"] == 7
  assert piece_after_audit["statut_stock"] == "NORMAL"

  # Clean up test db
  if os.path.exists(TEST_DB_FILE):
    try:
      os.remove(TEST_DB_FILE)
    except Exception:
      pass


if __name__ == "__main__":
  test_stock_and_maintenance_transactional_sync()
  print("Stock & Maintenance transactional tests passed!")
