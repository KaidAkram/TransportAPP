import sys
import os
from datetime import date, timedelta
from uuid import uuid4

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models import (
    Vehicule, Employe, Contrat, Caution, Document, Piece, Permis, Partenaire, Client, Chauffeur
)
from app.models.enums import (
    StatutVehicule, StatutEmploye, TypeEmploye, StatutContrat, TypeCaution, StatutCaution, RolePartenaire
)

def seed_fake_alerts():
    db = SessionLocal()
    try:
        print("Starting seeding fake alerts data...")
        today = date.today()

        # 1. Partner
        partenaire = db.query(Partenaire).filter_by(nom_commercial="Client Test Notifications").first()
        if not partenaire:
            partenaire = Client(
                id=uuid4(),
                nom_commercial="Client Test Notifications",
            )
            db.add(partenaire)
        
        # 2. Vehicule
        vehicule = db.query(Vehicule).filter_by(immatriculation="ALERT-001").first()
        if not vehicule:
            vehicule = Vehicule(
                id=uuid4(),
                immatriculation="ALERT-001",
                marque="Toyota",
                modele="Hilux",
                type="Pick-up",
                statut=StatutVehicule.DISPONIBLE,
                kilometrage_actuel=15000,
                cout_total=0
            )
            db.add(vehicule)
        
        # 3. Employe (Chauffeur)
        employe = db.query(Employe).filter_by(matricule="EMP-ALERT-1").first()
        if not employe:
            employe = Chauffeur(
                id=uuid4(),
                matricule="EMP-ALERT-1",
                nom="Test",
                prenom="Chauffeur",
                statut=StatutEmploye.ACTIF
            )
            db.add(employe)
            
            # Need to create Permis directly here. Let's make it expired.
            permis = Permis(
                id=uuid4(),
                chauffeur_id=employe.id,
                numero="PERMIS-ALERT-1",
                categories="B, D",
                date_obtention=today - timedelta(days=2000),
                date_expiration=today - timedelta(days=5) # Expired 5 days ago
            )
            db.add(permis)
        
        db.flush() # To get ids generated

        # 4. Contracts (1 expired, 1 soon)
        if not db.query(Contrat).filter_by(reference="CTR-EXP-1").first():
            c1 = Contrat(
                id=uuid4(),
                reference="CTR-EXP-1",
                objet="Contrat Expiré",
                partenaire_id=partenaire.id,
                date_debut=today - timedelta(days=365),
                date_fin=today - timedelta(days=2), # Expired 2 days ago
                montant=100000,
                statut=StatutContrat.ACTIF # Status ACTIF but date passed
            )
            db.add(c1)
        
        if not db.query(Contrat).filter_by(reference="CTR-WARN-1").first():
            c2 = Contrat(
                id=uuid4(),
                reference="CTR-WARN-1",
                objet="Contrat Expirant Bientôt",
                partenaire_id=partenaire.id,
                date_debut=today - timedelta(days=300),
                date_fin=today + timedelta(days=10), # Expires in 10 days
                montant=200000,
                statut=StatutContrat.ACTIF
            )
            db.add(c2)
            
        # 5. Cautions (1 soon)
        if not db.query(Caution).filter_by(numero="CAU-WARN-1").first():
            cau = Caution(
                id=uuid4(),
                numero="CAU-WARN-1",
                type=TypeCaution.BONNE_EXECUTION,
                montant=50000,
                banque_emetteur="BEA",
                date_emission=today - timedelta(days=100),
                date_echeance=today + timedelta(days=15), # Expires in 15 days
                statut=StatutCaution.CHEZ_CLIENT,
                client_id=partenaire.id,
                reference_numero="REF-123",
                objet="Objet Caution"
            )
            db.add(cau)

        # 6. Documents (Vehicule) - Assurance (Expired), Controle technique (Soon)
        if not db.query(Document).filter_by(nom="Assurance Expired").first():
            doc1 = Document(
                id=uuid4(),
                entity_type="vehicule",
                entity_id=vehicule.id,
                nom="Assurance Expired",
                type="Assurance",
                date_expiration=today - timedelta(days=1), # Expired 1 day ago
                url_fichier="/dummy.pdf"
            )
            db.add(doc1)
            
        if not db.query(Document).filter_by(nom="Contrôle technique Soon").first():
            doc2 = Document(
                id=uuid4(),
                entity_type="vehicule",
                entity_id=vehicule.id,
                nom="Contrôle technique Soon",
                type="Contrôle technique",
                date_expiration=today + timedelta(days=4), # Expires in 4 days
                url_fichier="/dummy.pdf"
            )
            db.add(doc2)
            
        # 7. Pieces (Stock) - 1 Zero, 1 Low
        if not db.query(Piece).filter_by(reference="PIECE-RUP-1").first():
            p1 = Piece(
                id=uuid4(),
                reference="PIECE-RUP-1",
                designation="Filtre à Huile Test",
                categorie="Filtres",
                stock_actuel=0,
                stock_minimum=5,
                unite="U"
            )
            db.add(p1)
            
        if not db.query(Piece).filter_by(reference="PIECE-LOW-1").first():
            p2 = Piece(
                id=uuid4(),
                reference="PIECE-LOW-1",
                designation="Plaquettes de frein Test",
                categorie="Freinage",
                stock_actuel=2,
                stock_minimum=10,
                unite="Jeu"
            )
            db.add(p2)
            
        db.commit()
        print("Fake alerts data seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_fake_alerts()
