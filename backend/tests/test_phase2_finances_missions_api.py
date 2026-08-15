import sys
import os
from datetime import datetime, date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models
from app.main import app
from app.core.database import get_db, Base

TEST_DB_FILE = os.path.join(os.path.dirname(__file__), "test_phase2.db")
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


def test_phase2_complete_lifecycle():
  # 1. Create Client, Vehicule, Chauffeur via API with unique codes
  partner_payload = {
    "nom_commercial": "Air Algérie Tours Phase 2",
    "nif": "001916009998887",
    "nis": "123456789012345679",
    "registre_commerce": "16/00-9998887B19",
    "adresse": "Zone Aéroportuaire Houari Boumédiène, Alger",
    "wilaya": "Alger",
    "telephone_principal": "023 85 40 00",
    "role_partenaire": "CLIENT",
    "type_client": "AGENCE_VOYAGE",
    "statut_crm": "Actif",
  }
  res_p = client.post("/api/v1/partenaires", json=partner_payload)
  assert res_p.status_code == 201, res_p.text
  c_id = res_p.json()["id"]

  vehicule_payload = {
    "immatriculation": "16-555666-00",
    "marque": "Mercedes-Benz",
    "modele": "Tourismo VIP",
    "type": "Bus",
    "annee": 2023,
    "nombre_places": 51,
    "kilometrage_actuel": 150000.0,
    "statut": "DISPONIBLE",
  }
  res_v = client.post("/api/v1/vehicules", json=vehicule_payload)
  assert res_v.status_code == 201, res_v.text
  v_id = res_v.json()["id"]

  chauffeur_payload = {
    "matricule": "CHF-P2-01",
    "nom": "Benali",
    "prenom": "Mohamed",
    "type_employe": "CHAUFFEUR",
    "statut": "ACTIF",
    "date_embauche": "2022-01-01",
  }
  res_e = client.post("/api/v1/employes", json=chauffeur_payload)
  assert res_e.status_code == 201, res_e.text
  e_id = res_e.json()["id"]

  # 2. Test Devis Creation & Financial Line Calculations
  devis_payload = {
    "client_id": c_id,
    "date_emission": str(date.today()),
    "date_validite": str(date.today() + timedelta(days=30)),
    "objet": "Transport de Délégation Oran → Alger",
    "conditions_reglement": "Règlement 30 jours virement BNA",
    "taux_tva": 19.0,
    "lignes": [
      {
        "service": "Transport Voyageurs",
        "description": "Trajet Oran → Alger (Bus 50 places)",
        "quantite": 1.0,
        "prix_unitaire": 250000.0,
      },
      {
        "service": "Frais d'Attente",
        "description": "Mise à disposition 2 heures",
        "quantite": 1.0,
        "prix_unitaire": 20000.0,
      },
    ],
  }

  res_dev = client.post("/api/v1/devis", json=devis_payload)
  assert res_dev.status_code == 201, res_dev.text
  devis_data = res_dev.json()
  assert devis_data["total_ht"] == 270000.0
  assert devis_data["montant_tva"] == 51300.0
  assert devis_data["total_ttc"] == 321300.0
  devis_id = devis_data["id"]

  # 3. Test Devis Conversion to Active Contract
  res_conv = client.post(f"/api/v1/devis/{devis_id}/convertir-contrat")
  assert res_conv.status_code == 200, res_conv.text
  assert "contrat_id"in res_conv.json()

  # 4. Test Facture Creation & Multi-Payment Ledger
  facture_payload = {
    "client_id": c_id,
    "date_emission": str(date.today()),
    "date_echeance": str(date.today() + timedelta(days=30)),
    "mode_reglement": "VIREMENT",
    "taux_tva": 19.0,
    "notes": "Facture relative à la convention de transport",
    "lignes": [
      {
        "service": "Transport Grand Tourisme",
        "description": "Prestation exécutée Oran → Alger",
        "quantite": 1.0,
        "prix_unitaire": 270000.0,
      }
    ],
  }

  res_fac = client.post("/api/v1/factures", json=facture_payload)
  assert res_fac.status_code == 201, res_fac.text
  fac_data = res_fac.json()
  fac_id = fac_data["id"]
  assert fac_data["total_ttc"] == 321300.0
  assert fac_data["montant_restant"] == 321300.0
  assert fac_data["statut"] == "EN_ATTENTE"

  # 5. Record Partial Payment (150,000 DZD)
  pay1_payload = {
    "date": str(date.today()),
    "montant": 150000.0,
    "mode": "VIREMENT",
    "reference": "VIR-BNA-88990",
    "banque": "BNA Agence 612",
    "notes": "Premier acompte versé",
  }
  res_p1 = client.post(f"/api/v1/factures/{fac_id}/paiements", json=pay1_payload)
  assert res_p1.status_code == 200, res_p1.text

  # Verify Invoice balance update
  res_fac_check = client.get(f"/api/v1/factures/{fac_id}")
  assert res_fac_check.status_code == 200
  fac_updated = res_fac_check.json()
  assert fac_updated["montant_paye"] == 150000.0
  assert fac_updated["montant_restant"] == 171300.0
  assert fac_updated["statut"] == "PARTIEL"

  # Record Final Payment (171,300 DZD)
  pay2_payload = {
    "date": str(date.today()),
    "montant": 171300.0,
    "mode": "CHEQUE",
    "reference": "CHQ-CPA-112233",
    "banque": "CPA",
    "notes": "Solde de tout compte",
  }
  res_p2 = client.post(f"/api/v1/factures/{fac_id}/paiements", json=pay2_payload)
  assert res_p2.status_code == 200, res_p2.text

  res_fac_paid = client.get(f"/api/v1/factures/{fac_id}")
  assert res_fac_paid.json()["statut"] == "PAYE"
  assert res_fac_paid.json()["montant_restant"] == 0.0

  # 7. Test Strategic BI KPIs & Excel Export
  res_bi = client.get("/api/v1/analytics/kpis")
  assert res_bi.status_code == 200
  bi_data = res_bi.json()
  assert "flotte_totale"in bi_data
  assert "top_clients"in bi_data
  assert "evolution_mensuelle"in bi_data

  # Excel export
  res_export = client.get("/api/v1/analytics/export/vehicules")
  assert res_export.status_code == 200
  assert len(res_export.content) >1000 # Valid binary Excel file

  # Cleanup
  if os.path.exists(TEST_DB_FILE):
    try:
      os.remove(TEST_DB_FILE)
    except Exception:
      pass


if __name__ == "__main__":
  test_phase2_complete_lifecycle()
  print("Phase 2 test suite passed 100%!")
