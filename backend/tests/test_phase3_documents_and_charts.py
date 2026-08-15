import io
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_admin_token():
  res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "123"})
  assert res.status_code == 200
  return res.json()["access_token"]


def get_gestionnaire_token():
  res = client.post("/api/v1/auth/login", json={"username": "gestionnaire", "password": "123"})
  assert res.status_code == 200
  return res.json()["access_token"]


def test_dashboard_kpis_and_charts():
  token = get_admin_token()
  headers = {"Authorization": f"Bearer {token}"}

  # 1. Test /dashboard
  res_dash = client.get("/api/v1/dashboard", headers=headers)
  assert res_dash.status_code == 200
  dash_data = res_dash.json()
  assert "kpi"in dash_data
  assert dash_data["kpi"]["vehicules"]["total"] >= 1

  # 2. Test /dashboard/kpis
  res_kpis = client.get("/api/v1/dashboard/kpis", headers=headers)
  assert res_kpis.status_code == 200
  kpi_data = res_kpis.json()
  assert "vehicules"in kpi_data
  assert "stock"in kpi_data

  # 3. Test /dashboard/charts
  res_charts = client.get("/api/v1/dashboard/charts", headers=headers)
  assert res_charts.status_code == 200
  charts_data = res_charts.json()
  assert "revenue_trend"in charts_data
  assert len(charts_data["revenue_trend"]) == 12
  assert "cost_breakdown"in charts_data
  assert "fleet_status"in charts_data
  assert "top_clients"in charts_data
  assert "critical_stock"in charts_data
  assert charts_data["total_ca_annuel"] >0


def test_document_lifecycle_upload_view_download_delete():
  token = get_admin_token()
  headers = {"Authorization": f"Bearer {token}"}

  # First get a valid vehicle id
  res_veh = client.get("/api/v1/vehicules", headers=headers)
  assert res_veh.status_code == 200
  veh_items = res_veh.json()["items"]
  assert len(veh_items) >0
  veh_id = veh_items[0]["id"]

  # 1. Upload a PDF file
  file_bytes = b"%PDF-1.4 Fake Test Document for Transport ERP Assurance Flotte"
  file_obj = io.BytesIO(file_bytes)

  upload_data = {
    "entity_type": "vehicule",
    "entity_id": str(veh_id),
    "document_type": "Assurance",
    "nom": "Police Assurance Test Unit",
    "description": "Document de test automatique pytest",
    "date_emission": "2026-01-01",
    "date_expiration": "2026-12-31",
  }

  res_upload = client.post(
    "/api/v1/upload",
    data=upload_data,
    files={"file": ("test_assurance.pdf", file_obj, "application/pdf")},
    headers=headers,
  )
  assert res_upload.status_code == 201
  doc_info = res_upload.json()
  assert doc_info["nom"] == "Police Assurance Test Unit"
  assert doc_info["document_type"] == "Assurance"
  assert doc_info["entity_type"] == "vehicule"
  assert doc_info["entity_id"] == str(veh_id)
  doc_id = doc_info["id"]

  # 2. List documents for vehicle
  res_list = client.get(f"/api/v1/entities/vehicule/{veh_id}/documents", headers=headers)
  assert res_list.status_code == 200
  list_data = res_list.json()
  assert list_data["total"] >= 1
  found = any(d["id"] == doc_id for d in list_data["items"])
  assert found is True

  # 3. View document (inline)
  res_view = client.get(f"/api/v1/documents/{doc_id}/view", headers=headers)
  assert res_view.status_code == 200
  assert "inline"in res_view.headers.get("content-disposition", "")

  # 4. Download document (attachment)
  res_dl = client.get(f"/api/v1/documents/{doc_id}/download", headers=headers)
  assert res_dl.status_code == 200
  assert "attachment"in res_dl.headers.get("content-disposition", "")
  assert res_dl.content == file_bytes

  # 5. Delete document
  res_del = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
  assert res_del.status_code == 200

  # 6. Verify 404 after deletion
  res_after = client.get(f"/api/v1/documents/{doc_id}/view", headers=headers)
  assert res_after.status_code == 404
