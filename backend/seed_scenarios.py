import os
import uuid
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import insert

from app.core.database import SessionLocal
from app.models.vehicule import Vehicule
from app.models.employe import Mecanicien
from app.models.stock import Piece, MouvementStock
from app.models.intervention import Intervention, InterventionPiece
from app.models.enums import CategorieIntervention, StatutIntervention, TypeMouvement, StatutVehicule

def run_scenarios():
    db = SessionLocal()
    
    print("Starting data generation for dynamic pricing scenarios...")
    
    # 1. Get or Create a Mechanic
    mec = db.query(Mecanicien).first()
    if not mec:
        mec = Mecanicien(
            id=uuid.uuid4(),
            nom="Martin",
            prenom="Jean",
            telephone="0555555555",
            email="jean.martin@example.com",
            specialite="Mécanique Générale"
        )
        db.add(mec)
        db.flush()
    
    # 2. Get or Create a Vehicle
    veh = db.query(Vehicule).first()
    if not veh:
        veh = Vehicule(
            id=uuid.uuid4(),
            immatriculation="00111-123-31",
            marque="Toyota",
            modele="Hilux",
            annee=2020,
            kilometrage_actuel=50000,
            statut=StatutVehicule.DISPONIBLE
        )
        db.add(veh)
        db.flush()
        
    # 3. Create Pieces for Scenarios
    # Piece A: Constant price
    piece_a = Piece(
        id=uuid.uuid4(),
        reference="FIL-HUI-001",
        designation="Filtre à Huile Standard",
        categorie="Filtres",
        unite="Pièce",
        stock_actuel=0,
        stock_minimum=5,
        prix_unitaire_moyen=0.0
    )
    
    # Piece B: Fluctuation in price (to show PUMP)
    piece_b = Piece(
        id=uuid.uuid4(),
        reference="PLA-FRE-001",
        designation="Plaquettes de frein Avant",
        categorie="Freinage",
        unite="Jeu",
        stock_actuel=0,
        stock_minimum=2,
        prix_unitaire_moyen=0.0
    )
    
    db.add(piece_a)
    db.add(piece_b)
    db.flush()
    
    print("Pieces created.")
    
    # 4. Simulate Receptions to set PUMP
    # Reception 1 for Piece A: 10 units at 1500 DZD
    def add_reception(piece, qty, price):
        old_qty = piece.stock_actuel
        old_val = old_qty * piece.prix_unitaire_moyen
        added_qty = qty
        added_val = qty * price
        new_qty = old_qty + added_qty
        if new_qty > 0:
            piece.prix_unitaire_moyen = (old_val + added_val) / new_qty
        piece.stock_actuel = new_qty
        
        mvt = MouvementStock(
            id=uuid.uuid4(),
            piece_id=piece.id,
            type=TypeMouvement.ENTREE,
            quantite=qty,
            date=date.today(),
            motif="Réception Fournisseur"
        )
        db.add(mvt)
        db.flush()

    print("Simulating stock receptions...")
    add_reception(piece_a, 10, 1500.0) # PUMP = 1500
    add_reception(piece_b, 5, 8000.0)  # PUMP = 8000
    add_reception(piece_b, 5, 10000.0) # PUMP = (40000 + 50000) / 10 = 9000
    
    print(f"Piece A PUMP: {piece_a.prix_unitaire_moyen} (Expected 1500)")
    print(f"Piece B PUMP: {piece_b.prix_unitaire_moyen} (Expected 9000)")
    
    # 5. Create Scenarios (Interventions)
    
    def create_intervention(num, prob, trav, main_doeuvre, parts):
        inter = Intervention(
            id=uuid.uuid4(),
            numero=num,
            vehicule_id=veh.id,
            mecanicien_responsable_id=mec.id,
            type=CategorieIntervention.CORRECTIVE,
            categorie="Maintenance Exemple",
            date=date.today(),
            kilometrage=veh.kilometrage_actuel,
            probleme_constate=prob,
            travail_effectue=trav,
            cout_main_doeuvre=main_doeuvre,
            statut=StatutIntervention.TERMINEE,
            cout_pieces=0.0,
            cout_total=0.0
        )
        db.add(inter)
        db.flush()
        
        cout_pieces = 0.0
        for p, qty in parts:
            p.stock_actuel -= qty
            pump = p.prix_unitaire_moyen
            cout_pieces += (pump * qty)
            
            ip = InterventionPiece(
                intervention_id=inter.id,
                piece_id=p.id,
                quantite_utilisee=qty,
                prix_unitaire_applique=pump
            )
            db.add(ip)
            
            mvt = MouvementStock(
                id=uuid.uuid4(),
                piece_id=p.id,
                type=TypeMouvement.SORTIE,
                quantite=qty,
                date=date.today(),
                motif=f"Consommation {num}",
                intervention_id=inter.id
            )
            db.add(mvt)
            
        inter.cout_pieces = cout_pieces
        inter.cout_total = main_doeuvre + cout_pieces
        db.flush()
        print(f"Created Intervention {num} with Total: {inter.cout_total}")
        
    print("Creating interventions...")
    # Scenario 1: Only Labor
    create_intervention(
        "SCN-001", 
        "Contrôle de routine, pas de pièce changée.", 
        "Inspection visuelle et diagnostic. RAS.",
        main_doeuvre=2500.0,
        parts=[]
    )
    
    # Scenario 2: Labor + Piece A
    create_intervention(
        "SCN-002",
        "Fuite d'huile moteur légère.",
        "Remplacement du filtre à huile.",
        main_doeuvre=1500.0,
        parts=[(piece_a, 1)] # 1 * 1500
    )
    
    # Scenario 3: Labor + Piece A + Piece B (High Cost)
    create_intervention(
        "SCN-003",
        "Bruit au freinage et vidange à faire.",
        "Remplacement des plaquettes avant et filtre à huile.",
        main_doeuvre=4000.0,
        parts=[(piece_a, 1), (piece_b, 1)] # 1 * 1500 + 1 * 9000
    )
    
    db.commit()
    print("All scenarios created successfully in the database!")
    db.close()

if __name__ == "__main__":
    run_scenarios()
