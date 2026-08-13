import os
import uuid
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import insert

# Ensure models are loaded
import app.models
from app.core.database import SessionLocal, engine, Base
from app.models.enums import (
    StatutVehicule,
    StatutEmploye,
    RolePartenaire,
    TypePartenaire,
    StatutCaution,
    TypeCaution,
    StatutContrat,
    CategorieIntervention,
    StatutIntervention,
    TypeMouvement,
)
from app.models.vehicule import Vehicule, Constat
from app.models.employe import Chauffeur, Mecanicien, Permis
from app.models.partenaire import Client, Fournisseur, Contact, CRMNote
from app.models.contrat import Contrat, Avenant, Caution
from app.models.stock import Piece, MouvementStock
from app.models.intervention import Intervention, intervention_pieces
from app.models.document import Document


def seed_database(db: Session):
    print("[INIT] Re-creating all tables cleanly from SQLAlchemy metadata...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("[SEED] Starting database population with verified corporate assets...")

    # 1. Seed Vehicles
    print("  -> Seeding Fleet Vehicles...")
    v1 = Vehicule(
        id=uuid.uuid4(),
        immatriculation="16-123456-00",
        marque="Mercedes-Benz",
        modele="Tourismo",
        type="Bus",
        nombre_places=49,
        annee=2022,
        date_mise_circulation=date(2022, 3, 15),
        kilometrage_actuel=245820.0,
        statut=StatutVehicule.DISPONIBLE,
        cout_total=185000.0,
    )
    v2 = Vehicule(
        id=uuid.uuid4(),
        immatriculation="16-654321-00",
        marque="Iveco",
        modele="Crossway",
        type="Bus",
        nombre_places=55,
        annee=2021,
        date_mise_circulation=date(2021, 6, 20),
        kilometrage_actuel=312000.0,
        statut=StatutVehicule.EN_MISSION,
        cout_total=320000.0,
    )
    v3 = Vehicule(
        id=uuid.uuid4(),
        immatriculation="16-789012-00",
        marque="Hyundai",
        modele="County",
        type="Minibus",
        nombre_places=28,
        annee=2023,
        date_mise_circulation=date(2023, 1, 10),
        kilometrage_actuel=89400.0,
        statut=StatutVehicule.MAINTENANCE,
        cout_total=95000.0,
    )
    db.add_all([v1, v2, v3])
    db.flush()

    # 2. Seed Employees with Single Table Inheritance
    print("  -> Seeding Employees (STI Chauffeurs & Mécaniciens)...")
    c1 = Chauffeur(
        id=uuid.uuid4(),
        matricule="CHF-001",
        nom="Mansouri",
        prenom="Karim",
        telephone="0550 12 34 56",
        date_naissance=date(1985, 4, 12),
        date_embauche=date(2018, 5, 2),
        adresse="Kouba, Alger",
        statut=StatutEmploye.ACTIF,
        fonction="Chauffeur Principal Tourisme",
        assurance=True,
        photo="/assets/avatars/driver_pro.jpg",
    )
    c2 = Chauffeur(
        id=uuid.uuid4(),
        matricule="CHF-002",
        nom="Belkacem",
        prenom="Omar",
        telephone="0550 98 76 54",
        date_naissance=date(1990, 8, 25),
        date_embauche=date(2021, 2, 15),
        adresse="Bab Ezzouar, Alger",
        statut=StatutEmploye.ACTIF,
        fonction="Chauffeur Longue Distance",
        assurance=True,
        photo="/assets/avatars/driver_pro.jpg",
    )
    m1 = Mecanicien(
        id=uuid.uuid4(),
        matricule="MEC-001",
        nom="Brahimi",
        prenom="Ahmed",
        telephone="0661 98 76 54",
        date_naissance=date(1980, 11, 3),
        date_embauche=date(2015, 3, 1),
        adresse="Rouiba, Alger",
        statut=StatutEmploye.ACTIF,
        specialite="Chef d'Atelier",
        experience="15 ans",
        type_mecanicien="Chef d'Atelier",
        photo="/assets/avatars/mechanic_pro.jpg",
    )
    m2 = Mecanicien(
        id=uuid.uuid4(),
        matricule="MEC-002",
        nom="Larbi",
        prenom="Youcef",
        telephone="0662 11 22 33",
        date_naissance=date(1988, 7, 19),
        date_embauche=date(2019, 9, 10),
        adresse="Baraki, Alger",
        statut=StatutEmploye.ACTIF,
        specialite="Électricien Poids Lourds & Diagnostic",
        experience="8 ans",
        type_mecanicien="Électricien",
        photo="/assets/avatars/mechanic_pro.jpg",
    )
    db.add_all([c1, c2, m1, m2])
    db.flush()

    # Seed Driver Licenses
    p1 = Permis(
        id=uuid.uuid4(),
        chauffeur_id=c1.id,
        numero="DZ-ALG-1985-004521",
        date_obtention=date(2005, 6, 15),
        date_expiration=date(2028, 6, 15),
        categories="B, C1, D, ED",
        scan_permis="/assets/documents/permis_mansouri.pdf",
    )
    p2 = Permis(
        id=uuid.uuid4(),
        chauffeur_id=c2.id,
        numero="DZ-ALG-1990-008912",
        date_obtention=date(2012, 9, 20),
        date_expiration=date(2027, 9, 20),
        categories="B, C1, D",
        scan_permis="/assets/documents/permis_belkacem.pdf",
    )
    db.add_all([p1, p2])
    db.flush()

    # 3. Seed Partners with STI (Clients & Fournisseurs)
    print("  -> Seeding CRM Partners (Clients & Fournisseurs)...")
    client1 = Client(
        id=uuid.uuid4(),
        nom_commercial="Air Algérie Tours & Prestations",
        type_client=TypePartenaire.ENTREPRISE,
        telephone_principal="+213 21 50 88 00",
        email="contact@airalgerie-tours.dz",
        adresse="1 Place Maurice Audin",
        commune="Alger Centre",
        wilaya="Alger",
        code_postal="16000",
        site_web="https://airalgerie.dz",
        nif="000216001234567",
        nis="000216001234567890",
        registre_commerce="16/00-0123456B20",
        article_imposition="16012345678",
        logo="/assets/partners/client_logo.jpg",
        statut_crm="Actif",
    )
    fournisseur1 = Fournisseur(
        id=uuid.uuid4(),
        nom_commercial="SARL Maghreb Pièces & Filtres",
        telephone_principal="+213 21 82 11 00",
        email="ventes@maghrebpieces.dz",
        adresse="Zone Industrielle Oued Smar, Lot 45",
        commune="Oued Smar",
        wilaya="Alger",
        code_postal="16200",
        nif="000516009876543",
        nis="000516009876543210",
        registre_commerce="16/00-0987654A21",
        article_imposition="16098765432",
        logo="/assets/partners/supplier_logo.jpg",
        specialite="Pièces de rechange Bus & Poids Lourds Mercedes / Iveco / MAN",
        statut_crm="Actif",
    )
    db.add_all([client1, fournisseur1])
    db.flush()

    # Seed Multi-Contacts
    cnt1 = Contact(
        id=uuid.uuid4(),
        partenaire_id=client1.id,
        nom="Haddad",
        prenom="Samir",
        fonction="Directeur des Opérations Sol",
        telephone="0550 11 22 33",
        email="s.haddad@airalgerie.dz",
        est_principal=True,
    )
    cnt2 = Contact(
        id=uuid.uuid4(),
        partenaire_id=fournisseur1.id,
        nom="Benaissa",
        prenom="Farid",
        fonction="Responsable Commercial Grands Comptes",
        telephone="0661 44 55 66",
        email="f.benaissa@maghrebpieces.dz",
        est_principal=True,
    )
    db.add_all([cnt1, cnt2])
    db.flush()

    # 4. Seed Contracts & Cautions
    print("  -> Seeding Contracts, Amendments & Bank Guarantees...")
    ctr1 = Contrat(
        id=uuid.uuid4(),
        reference="CTR-2026-001",
        partenaire_id=client1.id,
        objet="Convention de transport régulier de passagers et circuits touristiques 2026",
        type_contrat="Transport",
        date_debut=date(2026, 1, 1),
        date_fin=date(2026, 12, 31),
        montant=15000000.0,
        devise="DZD",
        mode_facturation="Mensuel",
        conditions_paiement="Virement bancaire à 30 jours",
        statut=StatutContrat.ACTIF,
    )
    av1 = Avenant(
        id=uuid.uuid4(),
        contrat_id=ctr1.id,
        numero="Avenant N°01",
        date=date(2026, 4, 15),
        objet="Extension de ligne vers Mostaganem et Tlemcen",
        description="Ajout de rotations régulières le week-end.",
        modif_montant=2500000.0,
        nouvelle_date_fin=date(2026, 12, 31),
    )
    cau1 = Caution(
        id=uuid.uuid4(),
        numero="CAU-2026-001",
        type=TypeCaution.BONNE_EXECUTION,
        client_id=client1.id,
        contrat_id=ctr1.id,
        montant=750000.0,
        devise="DZD",
        reference_type="Contrat",
        reference_numero="CTR-2026-001",
        objet="Garantie de bonne exécution du contrat CTR-2026-001",
        date_emission=date(2026, 1, 5),
        date_echeance=date(2026, 12, 31),
        banque_emetteur="Banque Nationale d'Algérie (BNA Agence 612)",
        statut=StatutCaution.CHEZ_CLIENT,
        url_caution_pdf="/assets/documents/cautions/caution_CAU-2026-001.pdf",
    )
    db.add_all([ctr1, av1, cau1])
    db.flush()

    # 5. Seed Inventory & Stock Movements
    print("  -> Seeding Spare Parts & Stock Ledger...")
    p_filtre = Piece(
        id=uuid.uuid4(),
        reference="FIL-001",
        designation="Filtre à huile Mercedes Tourismo OM470",
        categorie="Filtres",
        marque="Mann-Filter",
        modele_compatibilite="Mercedes Tourismo, Travego",
        unite="Pièce",
        stock_actuel=25,
        stock_minimum=10,
        emplacement="A-03-02",
        description="Filtre à huile haute performance pour moteur Euro 6.",
    )
    p_freins = Piece(
        id=uuid.uuid4(),
        reference="FRE-002",
        designation="Jeu Plaquettes de frein avant Knorr-Bremse",
        categorie="Freinage",
        marque="Knorr-Bremse",
        modele_compatibilite="Iveco Crossway, Mercedes Bus",
        unite="Jeu",
        stock_actuel=4,
        stock_minimum=10,
        emplacement="B-01-04",
        description="Plaquettes de frein haute endurance essieu avant.",
    )
    p_batterie = Piece(
        id=uuid.uuid4(),
        reference="BAT-005",
        designation="Batterie Heavy Duty 12V 225Ah",
        categorie="Électricité",
        marque="Varta",
        modele_compatibilite="Universel Bus & Autocars",
        unite="Pièce",
        stock_actuel=8,
        stock_minimum=5,
        emplacement="C-02-01",
    )
    db.add_all([p_filtre, p_freins, p_batterie])
    db.flush()

    # Seed Initial Stock Entries
    mvt1 = MouvementStock(
        id=uuid.uuid4(),
        piece_id=p_filtre.id,
        type=TypeMouvement.ENTREE,
        quantite=25,
        date=date(2026, 8, 1),
        motif="Achat initial stock magasin",
        fournisseur_id=fournisseur1.id,
        reference_document="BL-2026-089",
    )
    mvt2 = MouvementStock(
        id=uuid.uuid4(),
        piece_id=p_freins.id,
        type=TypeMouvement.ENTREE,
        quantite=6,
        date=date(2026, 8, 5),
        motif="Réapprovisionnement atelier freinage",
        fournisseur_id=fournisseur1.id,
        reference_document="BL-2026-094",
    )
    db.add_all([mvt1, mvt2])
    db.flush()

    # 6. Seed Intervention with Auto Stock Deduction Traceability
    print("  -> Seeding Maintenance Intervention...")
    inter1 = Intervention(
        id=uuid.uuid4(),
        numero="INT-2026-0001",
        vehicule_id=v1.id,
        mecanicien_responsable_id=m1.id,
        type=CategorieIntervention.PREVENTIVE,
        categorie="Freinage & Révision",
        date=date(2026, 8, 12),
        kilometrage=245820.0,
        probleme_constate="Contrôle périodique système de freinage avant.",
        diagnostic="Plaquettes de frein avant à 85% d'usure. Remplacement requis.",
        travail_effectue="Remplacement jeu complet plaquettes de frein avant + contrôle d'étanchéité.",
        cout_total=45000.0,
        prochaine_date_maintenance=date(2026, 11, 12),
        prochain_kilo_maintenance=260000.0,
        statut=StatutIntervention.TERMINEE,
    )
    db.add(inter1)
    db.flush()

    # Link stock exit to this intervention
    mvt_sortie = MouvementStock(
        id=uuid.uuid4(),
        piece_id=p_freins.id,
        type=TypeMouvement.SORTIE,
        quantite=2,
        date=date(2026, 8, 12),
        motif="Intervention INT-2026-0001",
        intervention_id=inter1.id,
    )
    db.add(mvt_sortie)

    # Link junction table for piece consumption
    db.execute(
        insert(intervention_pieces).values(
            intervention_id=inter1.id,
            piece_id=p_freins.id,
            quantite_utilisee=2,
        )
    )

    # 7. Seed Universal Documents
    print("  -> Seeding Universal Documents...")
    doc_assurance = Document(
        id=uuid.uuid4(),
        nom="Police d'assurance Flotte 2026",
        type="Assurance",
        url_fichier="/assets/documents/assurance_bus1.pdf",
        date_emission=date(2026, 1, 1),
        date_expiration=date(2026, 12, 31),
        statut_validite="Valide",
        entity_type="vehicule",
        entity_id=v1.id,
    )
    db.add(doc_assurance)

    # 8. Seed CRM Note
    crm1 = CRMNote(
        id=uuid.uuid4(),
        partenaire_id=client1.id,
        type="Réunion",
        auteur="Directeur Général",
        date=date(2026, 8, 10),
        contenu="Revue trimestrielle des prestations touristiques et préparation du plan de transport automne 2026.",
    )
    db.add(crm1)

    db.commit()
    print("[SUCCESS] Database successfully populated with professional ERP data & corporate assets!")


if __name__ == "__main__":
    session = SessionLocal()
    seed_database(session)
    session.close()
