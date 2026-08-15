from fastapi.testclient import TestClient
from app.main import app

def test_everything_live():
  client = TestClient(app)
  
  # 1. Login
  login_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "123"})
  assert login_res.status_code == 200
  token = login_res.json()["access_token"]
  headers = {"Authorization": f"Bearer {token}"}
  
  # 2. Alerts
  alertes_res = client.get("/api/v1/alertes", headers=headers)
  assert alertes_res.status_code == 200
  print(f"[OK] /alertes returned {len(alertes_res.json()['items'])} alerts")
  
  # 3. Dashboard
  dash_res = client.get("/api/v1/dashboard", headers=headers)
  assert dash_res.status_code == 200
  print("[OK] /dashboard returned 200")
  
  # 4. Charts
  charts_res = client.get("/api/v1/dashboard/charts", headers=headers)
  assert charts_res.status_code == 200
  print("[OK] /dashboard/charts returned 200")
  
  # 5. Employees list & details
  emps_res = client.get("/api/v1/employes", headers=headers)
  assert emps_res.status_code == 200
  emps = emps_res.json()["items"]
  for e in emps[:5]:
    detail_res = client.get(f"/api/v1/employes/{e['id']}", headers=headers)
    assert detail_res.status_code == 200
    print(f"[OK] /employes/{e['id']} ({e['nom']} - {e['type_employe']}) returned 200")

  # 6. Vehicles list & details
  veh_res = client.get("/api/v1/vehicules", headers=headers)
  assert veh_res.status_code == 200
  vehs = veh_res.json()["items"]
  for v in vehs[:3]:
    detail_res = client.get(f"/api/v1/vehicules/{v['id']}", headers=headers)
    assert detail_res.status_code == 200
    print(f"[OK] /vehicules/{v['id']} ({v['immatriculation']}) returned 200")

  # 7. Cautions
  caut_res = client.get("/api/v1/cautions", headers=headers)
  assert caut_res.status_code == 200
  print(f"[OK] /cautions returned {len(caut_res.json()['items'])} items")

  print("\n>>>ALL CHECKS PASSED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
  test_everything_live()
