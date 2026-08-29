import requests

endpoints = [
    "/api/v1/cautions",
    "/api/v1/contrats",
    "/api/v1/employes",
    "/api/v1/factures",
    "/api/v1/interventions",
    "/api/v1/partenaires",
    "/api/v1/stock/pieces",
    "/api/v1/stock/receptions",
    "/api/v1/vehicules"
]

base_url = "http://127.0.0.1:8000"

print("Running API tests for year and month filters...")

all_passed = True
for ep in endpoints:
    url = f"{base_url}{ep}?annee=2024&mois=8"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            print(f"✅ {ep} OK (Items returned: {len(items)})")
        else:
            print(f"❌ {ep} FAILED with status {response.status_code}: {response.text}")
            all_passed = False
    except Exception as e:
        print(f"❌ {ep} REQUEST FAILED: {str(e)}")
        all_passed = False

if all_passed:
    print("All endpoints tested successfully!")
else:
    print("Some endpoints failed.")
