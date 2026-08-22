import os
from sqlalchemy import create_engine, text

db_url = "postgresql://neondb_owner:npg_pKSBHzLW3u4V@ep-cold-hill-b206ed3m-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(db_url)

with engine.connect() as conn:
    conn.execute(text("ALTER TYPE type_caution ADD VALUE IF NOT EXISTS 'DEMANDE';"))
    conn.commit()
    print("Added DEMANDE to type_caution ENUM")
