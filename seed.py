"""
Comprehensive seed — every enum value and scenario covered.
Run:  python seed.py
"""
import os, sys, random, uuid, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from datetime import date, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.core.database import Base
import app.models
from app.models import (
    Employe, Vehicule, Chauffeur, Mecanicien, Permis,
    Partenaire, Client, Fournisseur, Contact, CRMNote,
    Contrat, Avenant, Caution,
    Piece, MouvementStock, Intervention,
    Devis, DevisLigne, Facture, FactureLigne, Paiement,
    DepenseVehicule, Constat, Document,
)
from app.models.enums import *

DB_PATH = os.path.join(os.path.dirname(__file__), "etransport.db")
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

def u(): return uuid.uuid4()
def d(y,m,day): return date(y,m,day)
def dp(days): return date.today() - timedelta(days=days)
def dr(days): return date.today() + timedelta(days=days)

# ── DROP + CREATE ─────────────────────────────────────────────
print("[SEED] Dropping + creating tables...")
with engine.connect() as conn:
    conn.execute(text("PRAGMA foreign_keys = OFF"))
    for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).fetchall():
        conn.execute(text(f'DROP TABLE IF EXISTS "{row[0]}"'))
    conn.execute(text("PRAGMA foreign_keys = ON"))
    conn.commit()
Base.metadata.create_all(bind=engine)

with Session(engine) as db:

    # ═══════════════════════════════════════════════════════════════
    #  VEHICULES — all types + all statuses
    # ═══════════════════════════════════════════════════════════════
    veh_raw = [
        # DISPONIBLE
        ("16245_A_18", "Mercedes",  "Sprinter 519",     "Minibus", 20, 2022, 145000, "DISPONIBLE"),
        ("17890_B_16", "Renault",   "Master L3H2",      "Minibus", 16, 2021, 198000, "DISPONIBLE"),
        ("08976_D_12", "Hyundai",   "County",           "Minibus", 24, 2020, 235000, "DISPONIBLE"),
        # EN_MISSION
        ("05123_C_07", "Iveco",     "Daily 50C18",      "Bus",     30, 2023,  87000, "EN_MISSION"),
        ("02345_F_05", "MAN",       "TGL 12.250",       "Bus",     45, 2019, 310000, "EN_MISSION"),
        ("15678_L_11", "Scania",    "Irizar i8",        "Bus",     48, 2023,  95000, "EN_MISSION"),
        # MAINTENANCE
        ("19034_E_22", "Toyota",    "Coaster",          "Minibus", 22, 2024,  32000, "MAINTENANCE"),
        ("09123_M_17", "Toyota",    "Hilux 4x4",        "Voiture",  5, 2024,  12000, "MAINTENANCE"),
        # IMMOBILISE
        ("11234_J_20", "Fiat",      "Ducato Maxi",      "Van",      9, 2022, 112000, "IMMOBILISE"),
        # HORS_SERVICE
        ("03456_K_03", "Volvo",     "9700",             "Bus",     52, 2021, 275000, "HORS_SERVICE"),
        # Extra DISPONIBLE
        ("14567_G_14", "Renault",   "Trafic Van",       "Van",      9, 2023,  45000, "DISPONIBLE"),
        ("07891_H_09", "Mercedes",  "Sprinter 313 CDI", "Van",      8, 2024,  18000, "DISPONIBLE"),
        ("20001_N_01", "Renault",   "Master Box",       "Van",      3, 2025,   8000, "DISPONIBLE"),
        ("20002_P_02", "Citroen",   "Jumper Utility",   "Van",      3, 2025,   5000, "DISPONIBLE"),
        ("20003_Q_03", "Peugeot",   "Boxer Combi",      "Minibus", 9, 2025,   3000, "DISPONIBLE"),
    ]
    vehicules = []
    for imm, marque, modele, tp, nb, an, km, st in veh_raw:
        v = Vehicule(
            id=u(), immatriculation=imm, marque=marque, modele=modele,
            type=tp, nombre_places=nb, annee=an,
            date_mise_circulation=d(an, random.randint(1,6), random.randint(1,28)),
            kilometrage_actuel=km, statut=StatutVehicule[st],
            cout_total=round(random.uniform(50000, 800000), 2),
        )
        db.add(v)
        vehicules.append(v)
    db.flush()
    print(f"  [OK] {len(vehicules)} vehicules ({len(set(v.statut.value for v in vehicules))} statuts distincts)")

    # ═══════════════════════════════════════════════════════════════
    #  EMPLOYES — all types + all statuses
    # ═══════════════════════════════════════════════════════════════
    chauffeurs = []
    chf_data = [
        # ACTIF
        ("CHF-001", "Benali",   "Karim",    d(1985,3,15),  "0555123456", "Rue Didouche Mourad, Alger",     d(2018,4,1),  "Cat D",      True,  "ACTIF"),
        ("CHF-002", "Mebarki",  "Youcef",   d(1990,7,22),  "0661234567", "Cite 1000 logements, Oran",      d(2019,9,15), "Cat D, D1",  True,  "ACTIF"),
        ("CHF-003", "Hadj",     "Mohamed",  d(1982,11,8),  "0770345678", "Bd Krim Belkacem, Alger",        d(2016,2,10), "Cat B, D",   True,  "ACTIF"),
        ("CHF-004", "Slimani",  "Abdelkader",d(1988,1,30), "0555456789", "Rue de la Republique, Constantine",d(2020,6,1), "Cat D",      True,  "ACTIF"),
        ("CHF-005", "Bouzid",   "Amine",    d(1993,5,12),  "0661567890", "Lot Bouchaoui, Tipaza",          d(2022,1,20), "Cat D, D1",  True,  "ACTIF"),
        # ABSENT
        ("CHF-006", "Khelifi",  "Samir",    d(1987,9,3),   "0770678901", "Rue Ahmed Bey, Blida",           d(2017,11,5), "Cat B, D",   True,  "ABSENT"),
        ("CHF-010", "Tlemcani", "Rachid",   d(1991,2,18),  "0555789012", "Cite AADL, Annaba",              d(2021,3,12), "Cat D",      True,  "ABSENT"),
        # SUSPENDU
        ("CHF-007", "Ferdi",    "Nassim",   d(1995,8,25),  "0661890123", "Rue Principale, Setif",          d(2023,6,1),  "Cat D",      False, "SUSPENDU"),
        # QUITTE
        ("CHF-008", "Djaballah","Hichem",   d(1989,4,7),   "0770901234", "Bd Emir Abdelkader, Tlemcen",    d(2015,3,1),  "Cat B, D",   True,  "QUITTE"),
    ]
    for mat, nom, pre, naiss, tel, adr, emb, cat, assur, st in chf_data:
        c = Chauffeur(
            id=u(), matricule=mat, nom=nom, prenom=pre,
            date_naissance=naiss, telephone=tel, adresse=adr,
            date_embauche=emb, statut=StatutEmploye[st],
            type_employe=TypeEmploye.CHAUFFEUR, fonction=cat, assurance=assur,
        )
        db.add(c)
        chauffeurs.append(c)
    db.flush()
    for c in chauffeurs:
        db.add(Permis(
            id=u(), chauffeur_id=c.id,
            numero=f"PERM-{random.randint(100000,999999)}",
            categories="B, D, D1",
            date_obtention=c.date_embauche - timedelta(days=random.randint(365,2000)),
            date_expiration=date.today() + timedelta(days=random.randint(-30, 1800)),
        ))
    db.flush()
    print(f"  [OK] {len(chauffeurs)} chauffeurs + permis")

    mecaniciens = []
    mec_data = [
        ("MEC-001", "Charef",  "Djamel", d(1980,6,25),  "0555111222", "Rue Abane Ramdane, Alger",   d(2015,8,1),  "Mecanique generale",  True,  "ACTIF"),
        ("MEC-002", "Zeroual", "Nabil",  d(1992,4,14),  "0661222333", "Lot 500 logements, Oran",    d(2020,2,1),  "Electromecanique",    True,  "ACTIF"),
        ("MEC-003", "Derriche","Samir",  d(1986,8,9),   "0770333444", "Cite Ben Aknoun, Alger",     d(2017,5,15), "Carrosserie",         False, "ACTIF"),
        ("MEC-004", "Zerhouni","Khaled", d(1994,1,20),  "0555444555", "Zone industrielle, Oran",    d(2022,9,1),  "Pneumatique",         False, "ABSENT"),
        ("MEC-005", "Taleb",   "Farid",  d(1983,12,3),  "0661555666", "Rue Didouche, Constantine",  d(2018,4,1),  "Mecanique generale",  True,  "SUSPENDU"),
    ]
    for mat, nom, pre, naiss, tel, adr, emb, spec, resp, st in mec_data:
        m = Mecanicien(
            id=u(), matricule=mat, nom=nom, prenom=pre,
            date_naissance=naiss, telephone=tel, adresse=adr,
            date_embauche=emb, statut=StatutEmploye[st],
            type_employe=TypeEmploye.MECANICIEN,
            specialite=spec, est_responsable=resp,
        )
        db.add(m)
        mecaniciens.append(m)
    db.flush()
    print(f"  [OK] {len(mecaniciens)} mecaniciens")

    admins = []
    for i, (mat, nom, pre, naiss, tel, adr, emb, st) in enumerate([
        ("ADM-001", "Bensalem", "Fatima", d(1990,12,1), "0555000111", "Alger Centre",     d(2019,1,1), "ACTIF"),
        ("ADM-002", "Aoudia",   "Lyes",   d(1988,8,20), "0661000222", "Hydra, Alger",      d(2018,6,1), "ACTIF"),
        ("ADM-003", "Megueddem","Sara",   d(1996,3,8),  "0770000333", "Ben Aknoun, Alger",  d(2023,9,1), "ABSENT"),
        ("ADM-004", "Noui",     "Walid",  d(1985,11,15),"0555000444", "Bab Ezzouar, Alger", d(2020,3,1), "QUITTE"),
    ]):
        e = Employe(
            id=u(), matricule=mat, nom=nom, prenom=pre,
            date_naissance=naiss, telephone=tel, adresse=adr,
            date_embauche=emb, statut=StatutEmploye[st],
            type_employe=TypeEmploye.ADMINISTRATIF,
        )
        db.add(e)
        admins.append(e)
    db.flush()
    print(f"  [OK] {len(admins)} administratifs")

    # ═══════════════════════════════════════════════════════════════
    #  PARTENAIRES — all roles + types
    # ═══════════════════════════════════════════════════════════════
    clients_raw = [
        # CLIENT + ENTREPRISE
        ("SONATRACH",           "ENTREPRISE",    "0987654321", "1234567890", "Hassi Messaoud, Ouargla",     "Ouargla",    "Hassi Messaoud", "30000", "0297654321", "contact@sonatrach.dz"),
        ("SONELGAZ",            "ENTREPRISE",    "0987654322", "1234567891", "Rue Larbi Ben M'Hidi, Alger", "Alger",       "Sidi M'Hamed",   "16000", "021634567",  "info@sonelgaz.dz"),
        ("ALGERIE TELECOM",     "ENTREPRISE",    "0987654323", "1234567892", "Cite Ali Mendjeli, Constantine","Constantine","Ali Mendjeli",   "25000", "031812345",  "contact@telecom.dz"),
        ("ENTP BTP SPA",        "ENTREPRISE",    "0987654324", "1234567893", "Rue Didouche Mourad, Alger",  "Alger",       "Hussein Dey",    "16000", "021789012",  "direction@entpbtp.dz"),
        ("SONACOM",             "ENTREPRISE",    "0987654325", "1234567894", "Zone industrielle, Oran",     "Oran",        "Bir El Djir",    "31000", "041567890",  "info@sonacom.dz"),
        # CLIENT + HOTEL
        ("HOTEL EL BARAKA",     "HOTEL",         "0987654327", "1234567896", "Bd Emir Abdelkader, Alger",   "Alger",       "Sidi Fredj",     "16000", "021901234",  "reservation@elbaraka.dz"),
        ("RADISSON BLU ORAN",   "HOTEL",         "0987654330", "1234567899", "Front de Mer, Oran",          "Oran",        "Oran Centre",    "31000", "041234567",  "info@radisson-oran.dz"),
        # CLIENT + ASSOCIATION
        ("ETAP",                "ORGANISME",     "0987654328", "1234567897", "Boulevard Khemisti, Alger",   "Alger",       "Bab Ezzouar",    "16005", "021912345",  "info@etap.dz"),
        # CLIENT + PARTICULIER
        ("BENMANSOUR SARL",     "PARTICULIER",   "0987654329", "1234567898", "Rue Principale, Tipaza",      "Tipaza",      "Kolea",          "42000", "024567890",  "contact@benmansour.dz"),
        # CLIENT + ASSOCIATION
        ("SYNDICAT TRANSPORT",  "ASSOCIATION",   "0987654331", "123456789A", "Avenue de la Liberte, Alger", "Alger",       "Alger Centre",   "16000", "021456789",  "syndicat@transport.dz"),
        # CLIENT + AUTRE
        ("TELECARBONE DZ",      "AUTRE",         "0987654332", "123456789B", "Zone Franche, Oran",          "Oran",        "Es Senia",       "31000", "041678901",  "info@telecarbone.dz"),
        # CLIENT + ENTREPRISE
        ("CIMA VERRE",          "ENTREPRISE",    "0987654333", "123456789C", "Zone industrielle, Mostaganem","Mostaganem", "Sidi Said",     "27000", "045345678",  "contact@cima-verre.dz"),
        ("EURL TRANSPORT OUEST","ENTREPRISE",    "0987654326", "1234567895", "Rue Front de Mer, Oran",      "Oran",        "Oran Centre",    "31000", "041345678",  "contact@transportouest.dz"),
        ("SOCIETE BATIMENT MOD","ENTREPRISE",    "0987654334", "123456789D", "Lot Targa, Blida",            "Blida",       "Targa",          "09000", "025456789",  "contact@batimentmoderne.dz"),
        ("GROUPE DAHMANI",      "ENTREPRISE",    "0987654335", "123456789E", "Boulevard Emir Abdelkader, Tlemcen","Tlemcen","Tlemcen Centre", "13000", "043234567",  "info@groupe-dahmani.dz"),
    ]
    clients = []
    for nom, tp, nif, nis, adr, wil, com, cp, tel, email in clients_raw:
        c = Client(
            id=u(), nom_commercial=nom, nif=nif, nis=nis,
            registre_commerce=f"RC-{random.randint(100000,999999)}",
            article_imposition=f"AI-{random.randint(10000,99999)}",
            adresse=adr, wilaya=wil, commune=com, code_postal=cp,
            telephone_principal=tel, email=email,
            role_partenaire=RolePartenaire.CLIENT,
            type_client=TypePartenaire[tp],
            statut_crm=random.choice(["Actif", "Actif", "Actif", "Prospect"]),
        )
        db.add(c)
        clients.append(c)
    db.flush()
    print(f"  [OK] {len(clients)} clients ({len(set(c.type_client.value for c in clients if c.type_client))} types)")

    fournisseurs = []
    for nom, spec, nif, nis, adr, wil, com, cp, tel, email in [
        ("TOTAL ALGERIE",        "Carburant & Lubrifiants",    "0987000001", "0310010001", "Rue Col. Lotfi, Alger",        "Alger",      "Bab Ezzouar",   "16005", "021810000", "contact@totalalg.dz"),
        ("OPTIMUS PIECES AUTO",  "Pieces detachees",           "0987000002", "0310010002", "Zone ind. Hassi Ameur, Tipaza","Tipaza",     "Hassi Ameur",   "42007", "024890000", "vente@optimusauto.dz"),
        ("SAFETY TRANS IT",      "Equipements de securite",    "0987000003", "0310010003", "Lot 1036, Dely Ibrahim",       "Alger",      "Dely Ibrahim",  "16320", "021915000", "info@safetytrans.dz"),
        ("FILTRALGERIE",         "Filtration industrielle",    "0987000004", "0310010004", "Zone Franche, Oran",           "Oran",       "Es Senia",      "31000", "041900000", "info@filtralgerie.dz"),
        ("ALGERIE PNEUMATIQUE",  "Pneumatiques & Equiperie",   "0987000005", "0310010005", "Rue Didouche Mourad, Alger",   "Alger",      "Hussein Dey",   "16000", "021760000", "vente@pneumatique.dz"),
        ("BATICAL SPA",          "Peinture & Traitements",     "0987000006", "0310010006", "Zone industrielle, Blida",     "Blida",      "Mouzaia",       "09000", "025470000", "info@batical.dz"),
        ("PARTENAIRE MIXTE SA",  "Transport & Logistique",     "0987000007", "0310010007", "Front de Mer, Oran",           "Oran",       "Oran Centre",   "31000", "041550000", "contact@partenairemixte.dz"),
    ]:
        f = Fournisseur(
            id=u(), nom_commercial=nom, nif=nif, nis=nis,
            adresse=adr, wilaya=wil, commune=com, code_postal=cp,
            telephone_principal=tel, email=email,
            role_partenaire=RolePartenaire.FOURNISSEUR,
            specialite=spec, statut_crm="Actif",
        )
        db.add(f)
        fournisseurs.append(f)

    # PARTENAIRE_MIXTE
    mixte = Partenaire(
        id=u(), nom_commercial="TRANS-MIXTE ALGERIE",
        nif="0987000008", nis="0310010008",
        adresse="Boulevard Emir Abdelkader, Oran",
        wilaya="Oran", commune="Oran Centre", code_postal="31000",
        telephone_principal="041110000", email="mixte@transmixte.dz",
        role_partenaire=RolePartenaire.PARTENAIRE_MIXTE,
        statut_crm="Actif",
    )
    db.add(mixte)
    db.flush()
    print(f"  [OK] {len(fournisseurs)} fournisseurs + 1 partenaire mixte")

    # ── CONTACTS ──────────────────────────────────────────────────
    contacts_count = 0
    for c in clients[:8]:
        db.add(Contact(
            id=u(), partenaire_id=c.id,
            nom="Direction", prenom="General",
            fonction="Directeur General",
            telephone=c.telephone_principal, email=c.email,
            est_principal=True,
        ))
        contacts_count += 1
        if random.random() > 0.4:
            db.add(Contact(
                id=u(), partenaire_id=c.id,
                nom="Comptabilite", prenom="Service",
                fonction="Responsable Comptabilite",
                telephone=f"021{random.randint(100000,999999)}",
                email=f"compta@{c.nom_commercial.lower().replace(' ','')}.dz",
                est_principal=False,
            ))
            contacts_count += 1
    db.flush()
    print(f"  [OK] {contacts_count} contacts")

    # ── CRM NOTES ─────────────────────────────────────────────────
    note_types = ["Appel", "Email", "Reunion", "Note"]
    notes_count = 0
    for c in clients:
        for i in range(random.randint(1, 4)):
            db.add(CRMNote(
                id=u(), partenaire_id=c.id,
                type=random.choice(note_types),
                auteur="Administrateur",
                date=dp(random.randint(1, 120)),
                contenu=random.choice([
                    "Appel telephonique - discussion sur les conditions du contrat",
                    "Email envoye - devis pour la prestation de transport",
                    "Reunion au siege - presentation de notre flotte et services",
                    "Note interne - client satisfait, renouvellement prevu",
                    "Suivi - relance pour validation du bon de commande",
                    "Nouveau contact etabli - interet pour la maintenance preventive",
                    "Visite sur site - inspection des vehicules de la flotte",
                    "Négociation tarifaire en cours pour le prochain exercice",
                ]),
            ))
            notes_count += 1
    db.flush()
    print(f"  [OK] {notes_count} notes CRM")

    # ═══════════════════════════════════════════════════════════════
    #  CONTRATS — ACTIF + EXPIRE, varied amounts & durations
    # ═══════════════════════════════════════════════════════════════
    contrats_raw = [
        ("CTR-2026-001", 0,  "Transport du personnel SITE <-> USINE",              "Transport",   d(2026,1,1),  d(2026,12,31), 18500000, "ACTIF"),
        ("CTR-2026-002", 1,  "Location minibars pour navettes internes",            "Location",    d(2026,3,1),  d(2027,2,28),   9600000, "ACTIF"),
        ("CTR-2025-003", 2,  "Prestation de transport interurbain",                 "Transport",   d(2025,6,15), d(2026,6,14),  24000000, "ACTIF"),
        ("CTR-2025-004", 3,  "Transport de chantier - materiel et personnel",       "Transport",   d(2025,9,1),  d(2026,8,31),   7200000, "EXPIRE"),
        ("CTR-2026-005", 4,  "Service de messagerie inter-villes",                  "Logistique",  d(2026,2,1),  d(2027,1,31),   5400000, "ACTIF"),
        ("CTR-2024-006", 5,  "Contrat cadre transport voyageurs annuel",            "Transport",   d(2024,4,1),  d(2025,3,31),  36000000, "EXPIRE"),
        ("CTR-2026-007", 6,  "Shuttle service hotel <-> aeroport",                  "Transport",   d(2026,5,1),  d(2027,4,30),   3600000, "ACTIF"),
        ("CTR-2026-008", 7,  "Fourniture et transport materiel de construction",    "Logistique",  d(2026,1,15), d(2026,12,15), 12000000, "ACTIF"),
        ("CTR-2025-009", 8,  "Transport biens equipements Industriels",             "Transport",   d(2025,3,1),  d(2026,2,28),   8400000, "EXPIRE"),
        ("CTR-2026-010", 9,  "Contrat syndical transport employes",                 "Transport",   d(2026,1,1),  d(2027,12,31),  4200000, "ACTIF"),
        ("CTR-2026-011", 10, "Distribution carbone et logistique",                   "Logistique",  d(2026,6,1),  d(2027,5,31),   2800000, "ACTIF"),
        ("CTR-2026-012", 11, "Transport verre et materiaux fragiles",               "Transport",   d(2026,4,1),  d(2027,3,31),   6000000, "ACTIF"),
        ("CTR-2023-013", 12, "Contrat historique transport general",                 "Transport",   d(2023,1,1),  d(2023,12,31), 15000000, "EXPIRE"),
        ("CTR-2026-014", 13, "Service transport chantier BTP",                       "Transport",   d(2026,2,15), d(2027,2,14),   9800000, "ACTIF"),
        ("CTR-2024-015", 14, "Contrat expires transport Dahmani",                    "Transport",   d(2024,7,1),  d(2025,6,30),  11200000, "EXPIRE"),
    ]
    contrats = []
    for ref, ci, obj, tc, dd, dm, mt, st in contrats_raw:
        c = Contrat(
            id=u(), reference=ref, partenaire_id=clients[ci].id,
            objet=obj, type_contrat=tc, date_debut=dd, date_fin=dm,
            montant=mt, devise="DZD",
            mode_facturation=random.choice(["Mensuel", "Trimestriel", "Annuel"]),
            conditions_paiement=random.choice(["Virement 30 jours", "Virement 45 jours", "Cheque 60 jours"]),
            statut=StatutContrat.ACTIF if st == "ACTIF" else StatutContrat.EXPIRE,
        )
        db.add(c)
        contrats.append(c)
    db.flush()
    print(f"  [OK] {len(contrats)} contrats ({sum(1 for c in contrats if c.statut==StatutContrat.ACTIF)} actifs, {sum(1 for c in contrats if c.statut==StatutContrat.EXPIRE)} expires)")

    # ── AVENANTS ──────────────────────────────────────────────────
    av_count = 0
    for ct in [contrats[0], contrats[2], contrats[4], contrats[7]]:
        for j in range(random.randint(1, 3)):
            db.add(Avenant(
                id=u(), contrat_id=ct.id,
                numero=f"Avenant N°{j+1:02d}",
                date=ct.date_debut + timedelta(days=random.randint(30, 120)),
                objet=random.choice(["Extension duree", "Modification montant", "Ajout de lignes", "Avenant technique"]),
                description="Avenant modification des conditions contractuelles",
                modif_montant=random.choice([None, round(random.uniform(500000, 3000000), 2)]),
            ))
            av_count += 1
    db.flush()
    print(f"  [OK] {av_count} avenants")

    # ═══════════════════════════════════════════════════════════════
    #  CAUTIONS — all types + all statuses
    # ═══════════════════════════════════════════════════════════════
    cautions_raw = [
        # SOUMISSION + different statuts
        ("CAU-2026-001", "SOUMISSION",      0,  0,  925000, "AO-05/2026 - Transport personnel",     "BNA Agence Arzew",         "CREATION"),
        ("CAU-2026-002", "SOUMISSION",      2,  2, 1200000, "Appel d'offres N°34/2025",             "CPA Oran",                 "CHEZ_CLIENT"),
        ("CAU-2026-003", "SOUMISSION",      4,  4,  270000, "AO Messagerie inter-villes",           "BDL Oran",                 "RETOURNEE"),
        ("CAU-2025-004", "SOUMISSION",      0,  0, 1850000, "AO-12/2025 - Transport general",       "BNA Direction Centrale",   "MAIN_LEVEE"),
        # BONNE_EXECUTION + different statuts
        ("CAU-2026-005", "BONNE_EXECUTION", 1,  1,  480000, "Bon de commande NAV-2026-018",         "BNA Direction Centrale",   "CREATION"),
        ("CAU-2026-006", "BONNE_EXECUTION", 0,  0,  925000, "CTR-2026-001 Transport personnel",     "BNA Agence Arzew",         "CHEZ_CLIENT"),
        ("CAU-2025-007", "BONNE_EXECUTION", 3,  3,  360000, "Contrat chantier BTP",                 "BNA Blida",                "RETOURNEE"),
        ("CAU-2024-008", "BONNE_EXECUTION", 5,  5, 1800000, "Contrat cadre voyageurs",              "BNA Direction Centrale",   "MAIN_LEVEE"),
        # DEMANDE + different statuts
        ("CAU-2026-009", "DEMANDE",         3,  3,  360000, "Demande caution chantier BTP",         "BNA Blida",                "CREATION"),
        ("CAU-2026-010", "DEMANDE",         5,  5, 1800000, "Demande caution voyageurs",            "BNA Direction Centrale",   "CHEZ_CLIENT"),
        ("CAU-2026-011", "DEMANDE",         7,  7,  600000, "Demande caution transport materiel",   "BDL Tipaza",               "RETOURNEE"),
        ("CAU-2025-012", "DEMANDE",         0,  0,  925000, "Demande caution generale",             "BNA Agence Arzew",         "MAIN_LEVEE"),
        # More for volume
        ("CAU-2026-013", "SOUMISSION",      6,  6,  180000, "AO Shuttle Hotel",                     "BDL Alger",                "CREATION"),
        ("CAU-2026-014", "BONNE_EXECUTION", 8,  8,  420000, "Contrat equipements industriels",      "CPA Constantine",          "CHEZ_CLIENT"),
        ("CAU-2026-015", "DEMANDE",         9,  9,  210000, "Demande syndicat transport",           "BNA Alger Centre",         "CREATION"),
    ]
    cautions = []
    for num, tp, ci, cti, mt, obj, banque, st in cautions_raw:
        ct = contrats[cti]
        c = Caution(
            id=u(), numero=num,
            type=TypeCaution[tp],
            client_id=clients[ci].id,
            contrat_id=ct.id,
            montant=mt, devise="DZD",
            reference_type="Contrat",
            reference_numero=ct.reference,
            objet=obj,
            date_emission=ct.date_debut + timedelta(days=random.randint(0, 30)),
            date_echeance=ct.date_fin,
            statut=StatutCaution[st],
            banque_emetteur=banque,
            lieu_demande=random.choice(["Arzew", "Alger", "Oran", "Constantine"]),
            lieu_soumission=random.choice(["Alger", "Oran", "Constantine", "Annaba"]),
            numero_compte_bancaire=f"001 00954 0300 {random.randint(100000, 999999)}",
            societe_nom="ENGTP - Direction Regionale Arzew",
        )
        db.add(c)
        cautions.append(c)
    db.flush()
    print(f"  [OK] {len(cautions)} cautions ({sum(1 for c in cautions if c.type==TypeCaution.SOUMISSION)} soumission, {sum(1 for c in cautions if c.type==TypeCaution.BONNE_EXECUTION)} bonne exec, {sum(1 for c in cautions if c.type==TypeCaution.DEMANDE)} demande)")

    # ═══════════════════════════════════════════════════════════════
    #  STOCK / PIECES — all categories + low-stock alerts
    # ═══════════════════════════════════════════════════════════════
    pieces_raw = [
        ("FLT-001", "Filtre a huile Mercedes Sprinter",     "Filtres",       "Bosch",       "Sprinter 2.2 CDI",     15, 5),
        ("FLT-002", "Filtre a air Renault Master",           "Filtres",       "Mann-Filter", "Master 2.3 dCi",       22, 8),
        ("FLT-003", "Filtre a gasoil Iveco Daily",           "Filtres",       "Fleetguard",  "Daily 3.0",            10, 5),
        ("FLT-004", "Filtre habitacle Toyota Coaster",       "Filtres",       "Denso",       "Coaster",               8, 4),
        ("FRN-001", "Plaquettes de frein avant",             "Freinage",      "TRW",         "Mercedes Sprinter",     8, 4),
        ("FRN-002", "Disques de frein avant",                "Freinage",      "Brembo",      "Iveco Daily",           6, 3),
        ("FRN-003", "Liquide de frein DOT4",                 "Freinage",      "Castrol",     "Universel",            30, 10),
        ("FRN-004", "Etrier de frein avant",                 "Freinage",      "TRW",         "Renault Master",        3, 2),
        ("PNE-001", "Pneu 225/75 R16C",                      "Pneumatique",   "Michelin",    "Minibus",              12, 6),
        ("PNE-002", "Pneu 235/75 R17.5",                     "Pneumatique",   "Continental", "Bus",                   8, 4),
        ("PNE-003", "Pneu 195/75 R16C",                      "Pneumatique",   "Goodyear",    "Van",                  15, 6),
        ("HUI-001", "Huile moteur 10W40 5L",                "Lubrifiant",    "Total Quartz", "Diesel",              50, 15),
        ("HUI-002", "Huile boite 75W90 1L",                 "Lubrifiant",    "Motul",        "Manuel",              20, 8),
        ("HUI-003", "Huile hydraulique 5L",                 "Lubrifiant",    "Shell",        "Direction assistee",   12, 5),
        ("BTR-001", "Batterie 12V 110Ah",                    "Electrique",    "Varta",        "Heavy Duty",           6, 3),
        ("AMB-001", "Ampoule H7 12V 55W",                    "Eclairage",     "Philips",      "Universel",           40, 15),
        ("AMB-002", "Ampoule LED FOG",                        "Eclairage",     "Osram",        "Bus",                 20, 8),
        ("POL-001", "Courroie trapezoidale",                 "Moteur",        "Gates",        "Iveco Daily",         10, 5),
        ("POL-002", "Courroie distribution",                 "Moteur",        "SKF",          "Mercedes Sprinter",    4, 2),
        ("REF-001", "Reservoir eau liquide refroidissement", "Refroidissement","Febi",        "Renault Master",       5, 2),
        ("SEN-001", "Capteur de vitesse",                    "Electrique",    "Bosch",        "Mercedes Sprinter",    4, 2),
        ("SEN-002", "Capteur PMS",                           "Electrique",    "Bosch",        "Iveco Daily",          3, 2),
        ("COR-001", "Joint de culasse",                      "Moteur",        "Victor Reinz","Renault Master",       2, 1),
        ("COR-002", "Turbo complet",                         "Moteur",        "Garrett",      "Iveco Daily",          1, 1),
    ]
    pieces = []
    for ref, des, cat, mar, mod, stock, min_s in pieces_raw:
        p = Piece(
            id=u(), reference=ref, designation=des, categorie=cat,
            marque=mar, modele_compatibilite=mod,
            stock_actuel=stock, stock_minimum=min_s,
            emplacement=f"{chr(65+random.randint(0,3))}-{random.randint(1,10):02d}-{random.randint(1,5):02d}",
        )
        db.add(p)
        pieces.append(p)
    db.flush()
    low = [p for p in pieces if p.stock_actuel <= p.stock_minimum]
    print(f"  [OK] {len(pieces)} pieces ({len(low)} en rupture/stock bas)")

    # ═══════════════════════════════════════════════════════════════
    #  INTERVENTIONS — all statuses + both types
    # ═══════════════════════════════════════════════════════════════
    iv_raw = [
        # PREVENTIVE + TERMINEE
        ("INT-2026-00001", 0,  "VIDANGE",              "PREVENTIVE", d(2026,1,15), 145000, 35000, "TERMINEE", None,  "Vidange complete + filtres"),
        ("INT-2026-00002", 2,  "Revision generale",    "PREVENTIVE", d(2026,2,10),  87000, 45000, "TERMINEE", None,  "Revision complete 80 000 km"),
        ("INT-2026-00003", 7,  "VIDANGE",              "PREVENTIVE", d(2026,2,28), 112000, 30000, "TERMINEE", None,  "Vidange + vidange boite VTC"),
        ("INT-2026-00004", 11, "VIDANGE",              "PREVENTIVE", d(2026,3,10),   8000, 12000, "TERMINEE", None,  "Premiere vidange 5 000 km"),
        # PREVENTIVE + PLANIFIEE
        ("INT-2026-00005", 0,  "VIDANGE",              "PREVENTIVE", d(2026,5,1),  155000, 38000, "PLANIFIEE", d(2026,5,1),  "Prochaine vidange prevue"),
        ("INT-2026-00006", 3,  "Revision generale",    "PREVENTIVE", d(2026,6,15), 240000, 50000, "PLANIFIEE", d(2026,6,15), "Revision 240 000 km"),
        # CORRECTIVE + TERMINEE
        ("INT-2026-00007", 4,  "Freinage",             "CORRECTIVE", d(2026,3,5),  235000, 22000, "TERMINEE", None,  "Remplacement plaquettes + disques"),
        ("INT-2026-00008", 5,  "Pneumatique",          "CORRECTIVE", d(2026,3,25), 310000, 12000, "TERMINEE", None,  "Remplacement pneu avant gauche"),
        ("INT-2026-00009", 8,  "Electrique",           "CORRECTIVE", d(2026,4,1),  112000,  8000, "TERMINEE", None,  "Remplacement batterie + diagnostic"),
        # CORRECTIVE + EN_COURS
        ("INT-2026-00010", 3,  "Moteur",               "CORRECTIVE", d(2026,4,10), 235000, 15000, "EN_COURS", None,  "Surchauffe moteur - diagnostic"),
        ("INT-2026-00011", 0,  "Carrosserie",           "CORRECTIVE", d(2026,4,15), 148000,  5000, "EN_COURS", None,  "Reparation bossoir + peinture"),
        # CORRECTIVE + PLANIFIEE
        ("INT-2026-00012", 1,  "Carrosserie",           "CORRECTIVE", d(2026,4,20), 198000,  5000, "PLANIFIEE", d(2026,4,20), "Reparation porte arriere"),
        ("INT-2026-00013", 6,  "Moteur",               "CORRECTIVE", d(2026,4,25),  95000,  8000, "PLANIFIEE", d(2026,4,25), "Remplacement turbo"),
        # ANNULEE
        ("INT-2026-00014", 2,  "Freinage",             "CORRECTIVE", d(2026,3,15),  90000,  3000, "ANNULEE", None,  "Annule - mauvaise date"),
        # EXTERNE
        ("INT-2026-00015", 9,  "Revision generale",    "PREVENTIVE", d(2026,3,20), 275000, 60000, "TERMINEE", None,  "Revision externe garage PartenAIR"),
        ("INT-2026-00016", 10, "Pneumatique",          "CORRECTIVE", d(2026,4,5),   95000, 10000, "TERMINEE", None,  "Equilibrage + parallélisme externe"),
    ]
    interventions = []
    for num, vi, cat, tp, dt, km, ct, st, pdt, trav in iv_raw:
        iv = Intervention(
            id=u(), numero=num,
            vehicule_id=vehicules[vi].id,
            mecanicien_responsable_id=random.choice(mecaniciens[:3]).id,
            type=CategorieIntervention[tp],
            categorie=cat, date=dt, kilometrage=km,
            travail_effectue=trav,
            est_externe=(num in ["INT-2026-00015", "INT-2026-00016"]),
            prestataire_nom="PartenAIR Garage" if num == "INT-2026-00015" else None,
            prestataire_telephone="021456789" if num == "INT-2026-00015" else None,
            cout_total=ct,
            prochaine_date_maintenance=pdt,
            statut=StatutIntervention[st],
        )
        db.add(iv)
        interventions.append(iv)
    db.flush()
    print(f"  [OK] {len(interventions)} interventions ({sum(1 for i in interventions if i.type==CategorieIntervention.PREVENTIVE)} preventives, {sum(1 for i in interventions if i.type==CategorieIntervention.CORRECTIVE)} correctives)")

    # ── MOUVEMENTS DE STOCK ──────────────────────────────────────
    mvt_count = 0
    for iv in interventions[:8]:
        for p in random.sample(pieces, random.randint(1, 2)):
            db.add(MouvementStock(
                id=u(), piece_id=p.id, type=TypeMouvement.SORTIE,
                quantite=random.randint(1, 3), date=iv.date,
                motif=f"Intervention {iv.numero}", intervention_id=iv.id,
                fournisseur_id=random.choice(fournisseurs[:4]).id,
            ))
            mvt_count += 1
    for i in range(8):
        db.add(MouvementStock(
            id=u(), piece_id=random.choice(pieces).id,
            type=TypeMouvement.ENTREE,
            quantite=random.randint(5, 30),
            date=dp(random.randint(1, 90)),
            motif="Reapprovisionnement fournisseur",
            fournisseur_id=random.choice(fournisseurs[:4]).id,
        ))
        mvt_count += 1
    for i in range(2):
        db.add(MouvementStock(
            id=u(), piece_id=random.choice(pieces).id,
            type=TypeMouvement.INVENTAIRE,
            quantite=0,
            date=dp(random.randint(1, 30)),
            motif="Inventaire periodique",
            ecart_inventaire=random.choice([-2, -1, 0, 0, 1]),
        ))
        mvt_count += 1
    db.flush()
    print(f"  [OK] {mvt_count} mouvements stock")

    # ═══════════════════════════════════════════════════════════════
    #  DEVIS — all 5 statuses
    # ═══════════════════════════════════════════════════════════════
    devis_raw = [
        (0,  "Transport personnel Juin 2026",          "BROUILLON"),
        (1,  "Location minibars T2 2026",              "ENVOYE"),
        (2,  "Transport interurbain Aout 2026",        "ACCEPTE"),
        (3,  "Transport chantier materiel lourd",      "REFUSE"),
        (4,  "Messagerie mensuelle Juillet 2026",      "EXPIRE"),
        (5,  "Transport voyageurs ete 2026",           "ACCEPTE"),
        (6,  "Shuttle hotel aeroport Sept 2026",       "ENVOYE"),
        (7,  "Transport materiaux de construction",    "BROUILLON"),
        (0,  "Devis supplementaire SONATRACH",         "ACCEPTE"),
        (9,  "Transport syndical Q3 2026",             "ENVOYE"),
        (11, "Transport verre fragile",                "ACCEPTE"),
        (14, "Transport general Dahmani",              "REFUSE"),
    ]
    devis_list = []
    for ci, obj, st in devis_raw:
        tht = round(random.uniform(300000, 3000000), 2)
        tva = round(tht * 19 / 100, 2)
        dev = Devis(
            id=u(), numero=f"DEV-2026-{len(devis_list)+1:04d}",
            client_id=clients[ci].id,
            date_emission=dp(random.randint(5, 90)),
            date_validite=dr(random.randint(-30, 60)),
            statut=StatutDevis[st],
            objet=obj, conditions_reglement="Virement 30 jours",
            total_ht=tht, taux_tva=19.0,
            montant_tva=tva, total_ttc=round(tht + tva, 2),
        )
        db.add(dev)
        devis_list.append(dev)
    db.flush()
    for dev in devis_list:
        for _ in range(random.randint(1, 3)):
            qty = random.randint(1, 10)
            pu = round(random.uniform(15000, 150000), 2)
            db.add(DevisLigne(
                id=u(), devis_id=dev.id, service="Transport",
                description=f"Prestation - {dev.objet[:40]}",
                quantite=qty, prix_unitaire=pu,
                total_ligne=round(qty * pu, 2),
            ))
    db.flush()
    print(f"  [OK] {len(devis_list)} devis ({', '.join(f'{s.value}: {sum(1 for d in devis_list if d.statut==s)}' for s in StatutDevis)})")

    # ═══════════════════════════════════════════════════════════════
    #  FACTURES — all 5 statuses + all 4 modes
    # ═══════════════════════════════════════════════════════════════
    fact_raw = [
        (0,  "VIREMENT",  1850000, "PAYE"),
        (1,  "VIREMENT",       0, "EN_ATTENTE"),
        (2,  "CHEQUE",   1200000, "PARTIEL"),
        (4,  "VIREMENT",       0, "RETARD"),
        (0,  "VIREMENT",  920000, "PAYE"),
        (3,  "ESPECE",         0, "ANNULEE"),
        (5,  "CARTE",    500000, "PARTIEL"),
        (6,  "VIREMENT",       0, "EN_ATTENTE"),
        (7,  "CHEQUE",         0, "EN_ATTENTE"),
        (0,  "ESPECE",   400000, "PAYE"),
        (8,  "VIREMENT",       0, "RETARD"),
        (9,  "CARTE",    250000, "PARTIEL"),
    ]
    factures_list = []
    for ci, mode, mpay, st in fact_raw:
        tht = round(random.uniform(200000, 2500000), 2)
        tva = round(tht * 19 / 100, 2)
        ttc = round(tht + tva, 2)
        fc = Facture(
            id=u(), numero=f"FAC-2026-{len(factures_list)+1:04d}",
            client_id=clients[ci].id,
            contrat_id=random.choice(contrats[:8]).id,
            date_emission=dp(random.randint(10, 90)),
            date_echeance=dr(random.randint(-20, 30)),
            statut=StatutFacture[st],
            mode_reglement=ModePaiement[mode],
            total_ht=tht, taux_tva=19.0,
            montant_tva=tva, total_ttc=ttc,
            montant_paye=min(mpay, ttc),
            montant_restant=round(max(ttc - mpay, 0), 2),
            notes=random.choice([None, "Reglement en attente de validation", "Facture rectificative", None]),
        )
        db.add(fc)
        factures_list.append(fc)
    db.flush()
    for fc in factures_list:
        for _ in range(random.randint(1, 2)):
            qty = random.randint(1, 5)
            pu = round(random.uniform(20000, 200000), 2)
            db.add(FactureLigne(
                id=u(), facture_id=fc.id, service="Transport",
                description=f"Prestation - {fc.numero}",
                quantite=qty, prix_unitaire=pu,
                total_ligne=round(qty * pu, 2),
            ))
    # Paiements
    for fc in factures_list:
        if fc.montant_paye > 0:
            for j in range(random.randint(1, 2)):
                partiel = fc.montant_paye if j == 0 else round(fc.montant_paye * 0.3, 2)
                db.add(Paiement(
                    id=u(), facture_id=fc.id,
                    date=fc.date_emission + timedelta(days=random.randint(5, 25)),
                    montant=partiel,
                    mode=fc.mode_reglement,
                    reference=f"{'VIR' if fc.mode_reglement==ModePaiement.VIREMENT else 'CHQ'}-{random.randint(100000,999999)}",
                    banque=random.choice(["BNA", "CPA", "BADR", "BEA"]),
                    statut=random.choice([StatutPaiement.VALIDE, StatutPaiement.VALIDE, StatutPaiement.EN_ATTENTE]),
                ))
    db.flush()
    print(f"  [OK] {len(factures_list)} factures ({sum(1 for f in factures_list if f.montant_paye>0)} avec paiements)")

    # ═══════════════════════════════════════════════════════════════
    #  DEPENSES VEHICULES — all 9 categories
    # ═══════════════════════════════════════════════════════════════
    dep_count = 0
    for v in vehicules:
        cats = list(CategorieDepenseVehicule)
        for cat_dep in cats:
            db.add(DepenseVehicule(
                id=u(), vehicule_id=v.id,
                categorie=cat_dep,
                date=dp(random.randint(5, 180)),
                montant=round(random.uniform(2000, 120000), 2),
                kilometrage=v.kilometrage_actuel - random.randint(100, 10000),
                fournisseur=random.choice(["TOTAL ALGERIE", "OPTIMUS PIECES AUTO", "SAFETY TRANS IT", None]),
                notes=f"Depense {cat_dep.value.lower()} - {v.marque} {v.modele}",
            ))
            dep_count += 1
    db.flush()
    print(f"  [OK] {dep_count} depenses vehicules ({len(CategorieDepenseVehicule)} categories)")

    # ═══════════════════════════════════════════════════════════════
    #  CONSTATS — with/without tiers
    # ═══════════════════════════════════════════════════════════════
    constats_data = [
        (1,  True,  "Autoroute Est-Ouest",   "Changement de voie non signale", "Bossoir avant droit endommage",   "Toyota Corolla grise 12345_B_16"),
        (5,  True,  "Rocade Alger",          "Arret brusque - collision",      "Arriere carrosserie deformee",    "Volkswagen Golf noire 99887_C_05"),
        (0,  False, "RN1 Blida",             "Eclatement pneu - perte control", "Reparation carrosserie",         None),
        (3,  False, "Centre-ville Constantine","Deversage de chargement",       "Plancher charge endommage",       None),
        (4,  True,  "Piste Ouest - Oran",    "Depassement non reglementaire",  "Retroviseur casse + egratignures", "Peugeot 208 blanche 55667_D_09"),
    ]
    for vi, tiers, lieu, cir, dom, info in constats_data:
        db.add(Constat(
            id=u(), vehicule_id=vehicules[vi].id,
            chauffeur_id=random.choice(chauffeurs[:5]).id,
            date=dp(random.randint(5, 90)),
            heure=f"{random.randint(7,18):02d}:{random.randint(0,59):02d}",
            lieu=lieu, circonstances=cir, dommages=dom,
            tiers_implique=tiers, infos_tiers=info,
        ))
    db.flush()
    print(f"  [OK] {len(constats_data)} constats ({sum(1 for _,t,_,_,_,_ in constats_data if t)} avec tiers)")

    # ═══════════════════════════════════════════════════════════════
    #  DOCUMENTS — attached to all entity types
    # ═══════════════════════════════════════════════════════════════
    doc_count = 0
    # vehicules
    for v in vehicules[:5]:
        db.add(Document(id=u(), nom=f"Carte grise {v.immatriculation}", document_type="Carte Grise",
            url_fichier="/assets/documents/sample.pdf", mime_type="application/pdf",
            entity_type="vehicule", entity_id=v.id,
            date_emission=d(2022,1,1), date_expiration=d(2027,1,1)))
        doc_count += 1
    # employes
    for ch in chauffeurs[:4]:
        db.add(Document(id=u(), nom=f"Permis {ch.prenom} {ch.nom}", document_type="Permis",
            url_fichier="/assets/documents/sample.pdf", mime_type="application/pdf",
            entity_type="employe", entity_id=ch.id,
            date_emission=d(2020,6,1), date_expiration=d(2030,6,1)))
        doc_count += 1
    # contrats
    for ct in contrats[:5]:
        db.add(Document(id=u(), nom=f"Contrat {ct.reference}", document_type="Contrat",
            url_fichier="/assets/documents/sample.pdf", mime_type="application/pdf",
            entity_type="contrat", entity_id=ct.id))
        doc_count += 1
    # partenaires
    for cl in clients[:6]:
        db.add(Document(id=u(), nom=f"RC {cl.nom_commercial}", document_type="Registre de commerce",
            url_fichier="/assets/documents/sample.pdf", mime_type="application/pdf",
            entity_type="partenaire", entity_id=cl.id))
        doc_count += 1
    # cautions
    for ca in cautions[:4]:
        db.add(Document(id=u(), nom=f"Caution {ca.numero}", document_type="Caution Bancaire",
            url_fichier="/assets/documents/sample.pdf", mime_type="application/pdf",
            entity_type="caution", entity_id=ca.id))
        doc_count += 1
    # interventions
    for iv in interventions[:3]:
        db.add(Document(id=u(), nom=f"Rapport {iv.numero}", document_type="Rapport d'intervention",
            url_fichier="/assets/documents/sample.pdf", mime_type="application/pdf",
            entity_type="intervention", entity_id=iv.id))
        doc_count += 1
    db.flush()
    print(f"  [OK] {doc_count} documents (vehicules, employes, contrats, partenaires, cautions, interventions)")

    # ═══════════════════════════════════════════════════════════════
    db.commit()

    total = 0
    for t in Base.metadata.sorted_tables:
        count = db.execute(text(f'SELECT COUNT(*) FROM "{t.name}"')).scalar() or 0
        if count > 0:
            total += count
            print(f"    {t.name:30s} {count:>4d}")
    print(f"\n[SEED DONE] {total} records total across {len(Base.metadata.sorted_tables)} tables")
    print(f"  DB: {DB_PATH}")
