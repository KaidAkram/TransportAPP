import sys
import os
from datetime import date as dt_date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models
import app.models
from app.main import app
from app.core.database import get_db, Base
from app.models import Client, RolePartenaire, TypePartenaire

TEST_DB_FILE = os.path.join(os.path.dirname(__file__), "test_contrats.db")
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


def test_contrats_and_cautions_lifecycle():
    """Tests Contracts, Amendments (Avenants), Cautions, and PDF generation."""
    # 1. Seed a Client Partner first
    partner_payload = {
        "nom_commercial": "Air Algérie Catering SPA",
        "nif": "000016009876543",
        "adresse": "Aéroport Houari Boumediene, Alger",
        "wilaya": "Alger",
        "role_partenaire": "CLIENT",
        "type_client": "ENTREPRISE",
        "statut_crm": "Actif",
    }
    p_res = client.post("/api/v1/partenaires", json=partner_payload)
    assert p_res.status_code == 201, p_res.text
    client_id = p_res.json()["id"]

    # 2. Create Contract
    contract_payload = {
        "reference": "CTR-2026-AIRALG-01",
        "partenaire_id": client_id,
        "objet": "Transport régulier des équipages de bord et personnel navigant 2026",
        "type_contrat": "Transport",
        "date_debut": "2026-01-01",
        "date_fin": str(dt_date.today() + timedelta(days=25)),  # Expire dans 25 jours -> alerte
        "montant": 24000000.0,
        "devise": "DZD",
        "mode_facturation": "Mensuel",
        "conditions_paiement": "Virement bancaire 30 jours",
        "statut": "ACTIF",
    }
    c_res = client.post("/api/v1/contrats", json=contract_payload)
    assert c_res.status_code == 201, c_res.text
    contract_data = c_res.json()
    contract_id = contract_data["id"]
    assert contract_data["reference"] == "CTR-2026-AIRALG-01"
    assert contract_data["partenaire_nom"] == "Air Algérie Catering SPA"
    assert "Expire dans 25 jours" in contract_data["alerte_expiration"]

    # 3. Add Avenant to Contract (with financial increase)
    avenant_payload = {
        "numero": "Avenant N°01",
        "date": str(dt_date.today()),
        "objet": "Extension de desserte vers la base de maintenance",
        "description": "Ajout de 4 navettes quotidiennes.",
        "modif_montant": 3000000.0,
        "nouvelle_date_fin": str(dt_date.today() + timedelta(days=180)),
    }
    av_res = client.post(f"/api/v1/contrats/{contract_id}/avenants", json=avenant_payload)
    assert av_res.status_code == 201
    assert av_res.json()["numero"] == "Avenant N°01"

    # Verify Contract Detail reflects updated amount & date
    detail_res = client.get(f"/api/v1/contrats/{contract_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["total_avenants"] == 1
    assert detail["montant"] == 27000000.0  # 24M + 3M

    # 4. Create Caution (Bank Guarantee)
    caution_payload = {
        "numero": "CAU-2026-AIRALG-01",
        "type": "BONNE_EXECUTION",
        "client_id": client_id,
        "contrat_id": contract_id,
        "montant": 1350000.0,  # 5% of 27M
        "devise": "DZD",
        "reference_type": "Contrat",
        "reference_numero": "CTR-2026-AIRALG-01",
        "objet": "Caution de bonne exécution pour convention transport personnel",
        "date_emission": "2026-01-10",
        "date_echeance": str(dt_date.today() + timedelta(days=180)),
        "statut": "CHEZ_CLIENT",
        "banque_emetteur": "Banque Nationale d'Algérie (BNA Agence 612)",
    }
    cau_res = client.post("/api/v1/cautions", json=caution_payload)
    assert cau_res.status_code == 201, cau_res.text
    caution_id = cau_res.json()["id"]
    assert cau_res.json()["numero"] == "CAU-2026-AIRALG-01"

    # 5. Generate Bank Guarantee PDF Certificate
    pdf_res = client.post(f"/api/v1/cautions/{caution_id}/generate-pdf")
    assert pdf_res.status_code == 200, pdf_res.text
    pdf_data = pdf_res.json()
    assert pdf_data["url_caution_pdf"] is not None
    assert "/assets/documents/cautions/caution_CAU-2026-AIRALG-01.pdf" in pdf_data["url_caution_pdf"]

    # Verify physical file generated on disk
    expected_file = os.path.abspath("frontend/public/assets/documents/cautions/caution_CAU-2026-AIRALG-01.pdf")
    assert os.path.exists(expected_file), f"Generated PDF missing on disk: {expected_file}"
    assert os.path.getsize(expected_file) > 1000, "Generated PDF is empty or corrupt"

    # Clean up test db
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except Exception:
            pass


if __name__ == "__main__":
    test_contrats_and_cautions_lifecycle()
    print("Contracts, Avenants, and Cautions PDF tests passed!")
