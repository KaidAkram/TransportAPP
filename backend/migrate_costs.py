import os
import sqlalchemy
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print(f"Connecting to {db_url}...")
engine = sqlalchemy.create_engine(db_url)

with engine.begin() as conn:
    try:
        conn.execute(sqlalchemy.text("ALTER TABLE pieces ADD COLUMN prix_unitaire_moyen DOUBLE PRECISION NOT NULL DEFAULT 0.0"))
        print("Added prix_unitaire_moyen to pieces")
    except Exception as e:
        print(f"Skipping pieces alteration: {e}")

    try:
        conn.execute(sqlalchemy.text("ALTER TABLE interventions ADD COLUMN cout_main_doeuvre DOUBLE PRECISION NOT NULL DEFAULT 0.0"))
        print("Added cout_main_doeuvre to interventions")
    except Exception as e:
        print(f"Skipping interventions.cout_main_doeuvre alteration: {e}")

    try:
        conn.execute(sqlalchemy.text("ALTER TABLE interventions ADD COLUMN cout_pieces DOUBLE PRECISION NOT NULL DEFAULT 0.0"))
        print("Added cout_pieces to interventions")
    except Exception as e:
        print(f"Skipping interventions.cout_pieces alteration: {e}")

    try:
        conn.execute(sqlalchemy.text("ALTER TABLE intervention_pieces ADD COLUMN prix_unitaire_applique DOUBLE PRECISION NOT NULL DEFAULT 0.0"))
        print("Added prix_unitaire_applique to intervention_pieces")
    except Exception as e:
        print(f"Skipping intervention_pieces alteration: {e}")

print("Migration completed.")
