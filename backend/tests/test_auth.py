import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_login_admin_success():
  """Login with admin / 123 returns valid JWT token and admin role."""
  response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "123"})
  assert response.status_code == 200
  data = response.json()
  assert "access_token"in data
  assert data["token_type"] == "bearer"
  assert data["user"]["role"] == "admin"
  assert data["user"]["username"] == "admin"


def test_auth_login_gestionnaire_success():
  """Login with gestionnaire / 123 returns valid JWT token and gestionnaire role."""
  response = client.post("/api/v1/auth/login", json={"username": "gestionnaire", "password": "123"})
  assert response.status_code == 200
  data = response.json()
  assert "access_token"in data
  assert data["user"]["role"] == "gestionnaire"
  assert data["user"]["username"] == "gestionnaire"


def test_auth_login_invalid_credentials_returns_401():
  """Invalid username or password must return 401 Unauthorized."""
  response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpassword"})
  assert response.status_code == 401
  assert "detail"in response.json()


def test_auth_me_unauthenticated_returns_401():
  """Missing Authorization header must return 401."""
  response = client.get("/api/v1/auth/me")
  assert response.status_code == 401
  assert "detail"in response.json()


def test_auth_me_invalid_token_returns_401():
  """Invalid token format must return 401."""
  response = client.get(
    "/api/v1/auth/me",
    headers={"Authorization": "Bearer invalid.token.payload"},
  )
  assert response.status_code == 401


def test_auth_me_valid_token_returns_200():
  """Valid signed token from login must return 200 with user profile."""
  login_res = client.post("/api/v1/auth/login", json={"username": "gestionnaire", "password": "123"})
  token = login_res.json()["access_token"]

  me_res = client.get(
    "/api/v1/auth/me",
    headers={"Authorization": f"Bearer {token}"},
  )
  assert me_res.status_code == 200
  data = me_res.json()
  assert data["status"] == "authenticated"
  assert data["user"]["role"] == "gestionnaire"
  assert data["user"]["username"] == "gestionnaire"


def test_admin_role_authorization_guard():
  """Gestionnaire token must receive 403 on admin-only route; Admin token must receive 200."""
  # 1. Gestionnaire token
  gest_token = client.post("/api/v1/auth/login", json={"username": "gestionnaire", "password": "123"}).json()["access_token"]

  forbidden_res = client.get(
    "/api/v1/auth/admin-only",
    headers={"Authorization": f"Bearer {gest_token}"},
  )
  assert forbidden_res.status_code == 403

  # 2. Admin token
  admin_token = client.post("/api/v1/auth/login", json={"username": "admin", "password": "123"}).json()["access_token"]

  allowed_res = client.get(
    "/api/v1/auth/admin-only",
    headers={"Authorization": f"Bearer {admin_token}"},
  )
  assert allowed_res.status_code == 200
  assert "Welcome Administrator"in allowed_res.json()["message"]


if __name__ == "__main__":
  test_auth_login_admin_success()
  test_auth_login_gestionnaire_success()
  test_auth_login_invalid_credentials_returns_401()
  test_auth_me_unauthenticated_returns_401()
  test_auth_me_invalid_token_returns_401()
  test_auth_me_valid_token_returns_200()
  test_admin_role_authorization_guard()
  print("All authentication tests passed successfully!")
