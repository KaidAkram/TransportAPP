import sys
from uuid import UUID
from datetime import date
from app.core.database import SessionLocal
from app.schemas.caution import CautionCreate
from app.api.v1.cautions import create_caution

db = SessionLocal()
payload = CautionCreate(
    numero="CAU-TEST2",
    type="DEMANDE",
    client_id=UUID("6aa36ff7-ec4c-4b33-b23a-fd04f8c198f9"),
    montant=100,
    devise="DZD",
    reference_numero="123",
    objet="test",
    date_emission=date.today(),
    statut="CREATION"
)

try:
    res = create_caution(payload, db)
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
