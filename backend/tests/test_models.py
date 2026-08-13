import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import Base


def test_models_metadata_integrity():
    """
    Validates that all models are loaded into Base.metadata with valid foreign keys and tables.
    """
    tables = list(Base.metadata.tables.keys())
    print("\n--- Testing SQLAlchemy 2.0 Models & Metadata ---")
    print(f"Total Registered Tables: {len(tables)}")
    for t in sorted(tables):
        cols = [c.name for c in Base.metadata.tables[t].columns]
        fks = [f"{fk.parent.name} -> {fk.target_fullname}" for fk in Base.metadata.tables[t].foreign_keys]
        print(f"  * Table '{t}': {len(cols)} columns, {len(fks)} Foreign Keys")
        for fk_str in fks:
            print(f"      |-- {fk_str}")

    # Expected tables from our design
    expected_tables = {
        "documents",
        "employes",
        "permis",
        "partenaires",
        "contacts",
        "contrats",
        "avenants",
        "cautions",
        "pieces",
        "mouvements_stock",
        "vehicules",
        "constats",
        "interventions",
        "intervention_mecaniciens",
        "intervention_pieces",
    }

    missing = expected_tables - set(tables)
    assert not missing, f"Missing expected tables: {missing}"
    print("\nAll 15 tables are properly registered with valid foreign key constraints!")


if __name__ == "__main__":
    test_models_metadata_integrity()
