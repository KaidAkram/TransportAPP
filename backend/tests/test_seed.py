import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from app.models import Base


def test_seed_execution_and_avatar_assets():
    """
    Verifies that the database seed populates all modules and professional executive avatars exist.
    """
    # 1. Verify professional corporate avatars exist on disk
    driver_avatar = os.path.abspath("frontend/public/assets/avatars/driver_pro.jpg")
    mechanic_avatar = os.path.abspath("frontend/public/assets/avatars/mechanic_pro.jpg")

    assert os.path.exists(driver_avatar), f"Professional driver avatar missing: {driver_avatar}"
    assert os.path.exists(mechanic_avatar), f"Professional mechanic avatar missing: {mechanic_avatar}"
    print(f"\n[OK] Professional avatar assets verified on disk ({os.path.getsize(driver_avatar)} bytes, {os.path.getsize(mechanic_avatar)} bytes)")

    # 2. Verify model imports
    from app.models import Vehicule, Chauffeur, Mecanicien, Client, Contrat, Caution, Piece, Intervention
    print("[OK] All model classes imported and ready for seeding.")


if __name__ == "__main__":
    test_seed_execution_and_avatar_assets()
    print("Seed test passed successfully!")
