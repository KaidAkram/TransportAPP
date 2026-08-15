import os
import uuid
from pathlib import Path
from datetime import date, datetime, timedelta
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
  StatutDevis,
  StatutFacture,
  ModePaiement,
  StatutPaiement,
  CategorieDepenseVehicule,
)
from app.models.vehicule import Vehicule, Constat
from app.models.employe import Chauffeur, Mecanicien, Permis
from app.models.partenaire import Client, Fournisseur, Contact, CRMNote
from app.models.contrat import Contrat, Avenant, Caution
from app.models.stock import Piece, MouvementStock
from app.models.intervention import Intervention, intervention_pieces, intervention_mecaniciens
from app.models.document import Document
from app.models.finance import Devis, DevisLigne, Facture, FactureLigne, Paiement, DepenseVehicule
from app.models.feature_toggle import FeatureToggle
from app.api.v1.admin_features import DEFAULT_FEATURES
from app.services.pdf_finance_service import generate_devis_pdf, generate_facture_pdf
from app.services.pdf_service import generate_caution_pdf


def seed_database(db: Session):
  print("[INIT] Dropping and re-creating all tables cleanly from SQLAlchemy metadata...")
  Base.metadata.drop_all(bind=engine)
  Base.metadata.create_all(bind=engine)

  print("[SEED] Starting comprehensive ERP data population (15+ Vehicles, 20+ Employees, 15+ Partners, 30+ Interventions, 20+ Parts)...")

  # =========================================================================
  # 0. Seed Feature Toggles
  # =========================================================================
  print("->Seeding Feature Toggles...")
  for feat in DEFAULT_FEATURES:
    ft = FeatureToggle(
      id=uuid.uuid4(),
      feature_name=feat["feature_name"],
      description=feat["description"],
      categorie=feat["categorie"],
      enabled_for_gestionnaire=True,
    )
    db.add(ft)
  db.flush()

  # =========================================================================
  # 1. Seed 16 Vehicles
  # =========================================================================
  print("->Seeding 16 Fleet Vehicles (Buses, Minibuses, Vans, Sedans)...")
  vehicles_data = [
    ("16-123456-00", "Mercedes-Benz", "Tourismo", "Bus", 49, 2022, date(2022, 3, 15), 245820.0, StatutVehicule.DISPONIBLE, 185000.0),
    ("16-654321-00", "Iveco", "Crossway", "Bus", 55, 2021, date(2021, 6, 20), 312000.0, StatutVehicule.DISPONIBLE, 320000.0),
    ("16-789012-00", "Hyundai", "County", "Minibus", 28, 2023, date(2023, 1, 10), 89400.0, StatutVehicule.MAINTENANCE, 95000.0),
    ("16-345678-00", "Mercedes-Benz", "Sprinter 516", "Minibus", 22, 2022, date(2022, 8, 14), 145000.0, StatutVehicule.DISPONIBLE, 110000.0),
    ("16-901234-00", "MAN", "Lion's Coach", "Bus", 53, 2020, date(2020, 2, 28), 410000.0, StatutVehicule.DISPONIBLE, 450000.0),
    ("16-567890-00", "Scania", "Touring HD", "Bus", 51, 2021, date(2021, 11, 5), 278000.0, StatutVehicule.DISPONIBLE, 260000.0),
    ("16-234567-00", "Toyota", "Coaster", "Minibus", 30, 2023, date(2023, 4, 18), 62000.0, StatutVehicule.DISPONIBLE, 45000.0),
    ("16-890123-00", "Renault", "Master Combi", "Van", 16, 2022, date(2022, 9, 22), 115000.0, StatutVehicule.DISPONIBLE, 78000.0),
    ("16-456789-00", "Peugeot", "Boxer Minibus", "Van", 17, 2021, date(2021, 5, 12), 188000.0, StatutVehicule.DISPONIBLE, 89000.0),
    ("16-012345-00", "Volkswagen", "Crafter 50", "Minibus", 19, 2022, date(2022, 10, 30), 98000.0, StatutVehicule.DISPONIBLE, 67000.0),
    ("16-678901-00", "Fiat", "Ducato Maxi", "Van", 15, 2020, date(2020, 7, 19), 235000.0, StatutVehicule.MAINTENANCE, 140000.0),
    ("16-321654-00", "Ford", "Transit Custom", "Van", 9, 2023, date(2023, 2, 14), 54000.0, StatutVehicule.DISPONIBLE, 35000.0),
    ("16-987321-00", "Toyota", "Corolla Prestige", "Voiture", 5, 2022, date(2022, 6, 1), 76000.0, StatutVehicule.DISPONIBLE, 28000.0),
    ("16-543210-00", "Skoda", "Octavia Business", "Voiture", 5, 2023, date(2023, 3, 10), 42000.0, StatutVehicule.DISPONIBLE, 22000.0),
    ("16-112233-00", "Hyundai", "Universe Noble", "Bus", 47, 2019, date(2019, 9, 15), 520000.0, StatutVehicule.DISPONIBLE, 580000.0),
    ("16-445566-00", "Mercedes-Benz", "Travego VIP", "Bus", 44, 2023, date(2023, 7, 20), 45000.0, StatutVehicule.DISPONIBLE, 85000.0),
  ]

  vehicules = []
  for immat, mrq, mdl, typ, places, an, dmc, km, st, cout in vehicles_data:
    v = Vehicule(
      id=uuid.uuid4(),
      immatriculation=immat,
      marque=mrq,
      modele=mdl,
      type=typ,
      nombre_places=places,
      annee=an,
      date_mise_circulation=dmc,
      kilometrage_actuel=km,
      statut=st,
      cout_total=cout,
    )
    db.add(v)
    vehicules.append(v)
  db.flush()

  # =========================================================================
  # 2. Seed 20 Employees (10 Drivers & 10 Mechanics)
  # =========================================================================
  print("->Seeding 20 Personnel (10 Chauffeurs with Permis & 10 Mécaniciens)...")
  drivers_data = [
    ("CHF-001", "Mansouri", "Karim", "0550 12 34 56", date(1985, 4, 12), date(2018, 5, 2), "Kouba, Alger", "Chauffeur Principal Tourisme", "DZ-ALG-1985-004521", "B, C1, D, ED", date(2005, 6, 15), date(2028, 6, 15)),
    ("CHF-002", "Belkacem", "Omar", "0550 98 76 54", date(1990, 8, 25), date(2021, 2, 15), "Bab Ezzouar, Alger", "Chauffeur Longue Distance", "DZ-ALG-1990-008912", "B, C1, D", date(2012, 9, 20), date(2027, 9, 20)),
    ("CHF-003", "Cherif", "Mustapha", "0551 22 33 44", date(1982, 11, 10), date(2017, 3, 10), "Boumerdès", "Chauffeur Grand Tourisme VIP", "DZ-BMS-1982-014522", "B, C, D, ED", date(2002, 4, 10), date(2027, 4, 10)),
    ("CHF-004", "Hamidi", "Rachid", "0552 33 44 55", date(1988, 3, 14), date(2019, 6, 1), "Blida", "Chauffeur Lignes Régulières", "DZ-BLD-1988-034891", "B, D", date(2010, 8, 12), date(2026, 8, 12)),
    ("CHF-005", "Zitouni", "Amine", "0553 44 55 66", date(1992, 7, 19), date(2022, 1, 15), "Hussein Dey, Alger", "Chauffeur Navettes Urbaines", "DZ-ALG-1992-094123", "B, D", date(2015, 5, 18), date(2028, 5, 18)),
    ("CHF-006", "Boudiaf", "Farid", "0554 55 66 77", date(1986, 1, 30), date(2018, 9, 20), "Chéraga, Alger", "Chauffeur Longue Distance Sud", "DZ-ALG-1986-077812", "B, C, D, ED", date(2008, 10, 22), date(2028, 10, 22)),
    ("CHF-007", "Saidi", "Tarek", "0555 66 77 88", date(1994, 9, 5), date(2023, 2, 1), "Zéralda, Alger", "Chauffeur Minibus Entreprises", "DZ-TIP-1994-012845", "B, D", date(2016, 11, 30), date(2029, 11, 30)),
    ("CHF-008", "Mebarki", "Abdelkader", "0556 77 88 99", date(1980, 5, 16), date(2015, 4, 12), "Birtouta, Alger", "Chauffeur Senior Autocar", "DZ-ALG-1980-001299", "B, C1, D, ED", date(2000, 7, 15), date(2026, 7, 15)),
    ("CHF-009", "Dahmani", "Sofiane", "0557 88 99 00", date(1991, 12, 8), date(2020, 8, 10), "Reghaïa, Alger", "Chauffeur Navettes Salariés", "DZ-ALG-1991-045612", "B, D", date(2013, 3, 25), date(2027, 3, 25)),
    ("CHF-010", "Guerfi", "Samir", "0558 99 00 11", date(1987, 6, 21), date(2019, 11, 5), "Tipaza", "Chauffeur Polyvalent Tourisme", "DZ-TIP-1987-034871", "B, C, D", date(2009, 12, 14), date(2027, 12, 14)),
  ]

  chauffeurs = []
  for mat, nom, pre, tel, dn, de, adr, fn, p_num, p_cat, p_obt, p_exp in drivers_data:
    ch = Chauffeur(
      id=uuid.uuid4(),
      matricule=mat,
      nom=nom,
      prenom=pre,
      telephone=tel,
      date_naissance=dn,
      date_embauche=de,
      adresse=adr,
      statut=StatutEmploye.ACTIF,
      fonction=fn,
      assurance=True,
      photo="/assets/avatars/driver_pro.jpg",
    )
    db.add(ch)
    db.flush()

    permis = Permis(
      id=uuid.uuid4(),
      chauffeur_id=ch.id,
      numero=p_num,
      categories=p_cat,
      date_obtention=p_obt,
      date_expiration=p_exp,
      scan_permis=f"/assets/documents/permis_{mat.lower()}.pdf",
    )
    db.add(permis)
    chauffeurs.append(ch)

  mechanics_data = [
    ("MEC-001", "Brahimi", "Ahmed", "0661 98 76 54", date(1980, 11, 3), date(2015, 3, 1), "Rouiba, Alger", "Chef d'Atelier", "18 ans", "Chef d'Atelier", True),
    ("MEC-002", "Larbi", "Youcef", "0662 11 22 33", date(1988, 7, 19), date(2019, 9, 10), "Baraki, Alger", "Électricien Poids Lourds & Diagnostic", "10 ans", "Électricien", False),
    ("MEC-003", "Kaci", "Mourad", "0663 22 33 44", date(1984, 2, 14), date(2016, 5, 20), "El Harrach, Alger", "Moteur & Transmission Diesel", "14 ans", "Mécanicien Moteur", False),
    ("MEC-004", "Boualem", "Nassim", "0664 33 44 55", date(1992, 10, 8), date(2021, 7, 1), "Dar El Beïda, Alger", "Systèmes Pneumatiques & Freinage", "6 ans", "Spécialiste Freinage", False),
    ("MEC-005", "Messai", "Djamel", "0665 44 55 66", date(1986, 6, 25), date(2017, 11, 15), "Bordj El Kiffan, Alger", "Climatisation & Circuits Frigorifiques", "11 ans", "Technicien Froid", False),
    ("MEC-006", "Allioua", "Reda", "0666 55 66 77", date(1990, 4, 18), date(2020, 2, 10), "Oued Smar, Alger", "Carrosserie & Tôlerie Poids Lourds", "8 ans", "Tôlier Carrossier", False),
    ("MEC-007", "Touati", "Khaled", "0667 66 77 88", date(1995, 8, 30), date(2023, 3, 1), "Les Eucalyptus, Alger", "Entretien Rapide & Vidange Flotte", "4 ans", "Aide Mécanicien", False),
    ("MEC-008", "Benali", "Hichem", "0668 77 88 99", date(1989, 1, 12), date(2018, 8, 25), "Gué de Constantine, Alger", "Suspension & Géométrie des Trains", "9 ans", "Mécanicien Châssis", False),
    ("MEC-009", "Meziane", "Lyes", "0669 88 99 00", date(1983, 9, 27), date(2015, 10, 5), "Bachdjerrah, Alger", "Diagnostic Électronique Multiplexage", "15 ans", "Électronicien", False),
    ("MEC-010", "Djouadi", "Abdenour", "0670 99 00 11", date(1993, 5, 4), date(2022, 4, 18), "Bordj Bou Arréridj", "Hydraulique & Direction Assistée", "7 ans", "Technicien Hydraulique", False),
  ]

  mecaniciens = []
  for mat, nom, pre, tel, dn, de, adr, spec, exp, typ_mec, resp in mechanics_data:
    mec = Mecanicien(
      id=uuid.uuid4(),
      matricule=mat,
      nom=nom,
      prenom=pre,
      telephone=tel,
      date_naissance=dn,
      date_embauche=de,
      adresse=adr,
      statut=StatutEmploye.ACTIF,
      fonction="Mécanicien Spécialiste",
      specialite=spec,
      experience=exp,
      type_mecanicien=typ_mec,
      est_responsable=resp,
      photo="/assets/avatars/mechanic_pro.jpg",
    )
    db.add(mec)
    mecaniciens.append(mec)
  db.flush()

  # =========================================================================
  # 3. Seed 16 CRM Partners (11 Clients & 5 Suppliers)
  # =========================================================================
  print("->Seeding 16 Partners (11 Clients + 5 Fournisseurs)...")
  clients_data = [
    ("Air Algérie Tours & Prestations", "contact@airalgerie-tours.dz", "+213 21 50 88 00", "1 Place Maurice Audin, Alger Centre", "Alger", "000216001234567", "000216001234567890", "16/00-0123456B20", "16012345678", "Samir Haddad", "Directeur Exploitation", "0550 11 22 33"),
    ("Sonatrach Direction Centrale Transport", "transport@sonatrach.dz", "+213 21 54 70 00", "Djenane El Malik, Hydra", "Alger", "000116009988776", "000116009988776655", "16/00-0099887B18", "16009988776", "Mohamed Brahimi", "Chef Département Logistique", "0550 22 33 44"),
    ("Cosider Groupe Travaux Publics", "logistique@cosider-groupe.dz", "+213 21 24 80 00", "Route de Dar El Beïda", "Alger", "000316005544332", "000316005544332211", "16/00-0554433B19", "16055443322", "Karim Mansour", "Responsable Flotte Chantiers", "0550 33 44 55"),
    ("Djezzy Optimum Telecom", "procurement@djezzy.dz", "+213 21 82 38 38", "Zone Industrielle Dar El Beïda", "Alger", "000416008877665", "000416008877665544", "16/00-0887766B21", "16088776655", "Yacine Bensaad", "Facilities Manager", "0550 44 55 66"),
    ("Ooredoo Algérie", "services@ooredoo.dz", "+213 21 90 00 00", "66 Route de Ouled Fayet", "Alger", "000616004433221", "000616004433221100", "16/00-0443322B20", "16044332211", "Nabil Khelifi", "Directeur Logistique Générale", "0550 55 66 77"),
    ("Cevital Agro-Industrie", "logistique@cevital.dz", "+213 34 21 44 00", "Nouveau Quai Port de Béjaïa", "Béjaïa", "000706001122334", "000706001122334455", "06/00-0112233B17", "06011223344", "Tarik Bouzid", "Coordonnateur Navettes", "0550 66 77 88"),
    ("Société Nationale des Véhicules Industriels (SNVI)", "commercial@snvi.dz", "+213 21 81 14 44", "Route Nationale N°5, Rouiba", "Alger", "000816007788990", "000816007788990011", "16/00-0778899B16", "16077889900", "Rachid Lamari", "Chef de Service Transport Personnel", "0550 77 88 99"),
    ("Entreprise du Métro d'Alger (EMA)", "contact@metroalger-dz.com", "+213 21 77 11 22", "170 Rue de Tripoli, Hussein Dey", "Alger", "000916003322110", "000916003322110099", "16/00-0332211B22", "16033221100", "Ali Benali", "Responsable Navettes Remplacement", "0550 88 99 00"),
    ("Groupe Saidal Pharmaceutique", "logistique@saidalgroup.dz", "+213 21 54 81 00", "Route Nationale N°8, El Harrach", "Alger", "001016006655443", "001016006655443322", "16/00-0665544B18", "16066554433", "Hocine Taleb", "Directeur Approvisionnements", "0550 99 00 11"),
    ("Université des Sciences et de la Technologie (USTHB)", "rectorat@usthb.dz", "+213 21 24 79 50", "BP 32 El Alia, Bab Ezzouar", "Alger", "001116002211009", "001116002211009988", "16/00-0221100B15", "16022110099", "Pr. Kamel Amara", "Doyen & Responsable Logistique Campus", "0551 00 11 22"),
    ("Algérie Télécom Direction Générale", "grandscomptes@algerietelecom.dz", "+213 21 76 10 00", "Route Nationale N°5, Cinq Maisons", "Alger", "001216008899001", "001216008899001122", "16/00-0889900B19", "16088990011", "Sofiane Merabet", "Directeur Relations Prestataires", "0551 11 22 33"),
  ]

  clients = []
  for nom, eml, tel, adr, wil, nif, nis, rc, ai, cnt_nom, cnt_fnc, cnt_tel in clients_data:
    cl = Client(
      id=uuid.uuid4(),
      nom_commercial=nom,
      email=eml,
      telephone_principal=tel,
      adresse=adr,
      wilaya=wil,
      commune=wil,
      code_postal="16000",
      nif=nif,
      nis=nis,
      registre_commerce=rc,
      article_imposition=ai,
      logo="/assets/partners/client_logo.jpg",
      statut_crm="Actif",
      type_client=TypePartenaire.ENTREPRISE,
    )
    db.add(cl)
    db.flush()

    cnt = Contact(
      id=uuid.uuid4(),
      partenaire_id=cl.id,
      nom=cnt_nom.split()[0],
      prenom=cnt_nom.split()[1] if len(cnt_nom.split()) >1 else "",
      fonction=cnt_fnc,
      telephone=cnt_tel,
      email=eml,
      est_principal=True,
    )
    db.add(cnt)
    clients.append(cl)

  suppliers_data = [
    ("SARL Maghreb Pièces & Filtres", "ventes@maghrebpieces.dz", "+213 21 82 11 00", "Zone Industrielle Oued Smar", "Alger", "000516009876543", "Pièces de rechange Bus & Poids Lourds Mercedes / Iveco / MAN", "Farid Benaissa"),
    ("Michelin Algérie Pneumatiques", "contact@michelin.dz", "+213 21 59 12 00", "Zone Industrielle Rouiba", "Alger", "001316001133557", "Pneumatiques Poids Lourds & Autocars Haute Endurance", "Adel Ziani"),
    ("TotalEnergies Lubrifiants Algérie", "commandes@totalenergies.dz", "+213 21 68 20 00", "Pins Maritimes, Mohammadia", "Alger", "001416002244668", "Huiles Moteur Synthèse & Liquides de Refroidissement", "Kamel Touati"),
    ("Bosch Diesel Center Algérie", "service@boschdiesel.dz", "+213 21 44 80 00", "Zone Industrielle Baba Ali", "Alger", "001516003355779", "Injecteurs, Alternateurs, Démarreurs et Diagnostic Électrique", "Mourad Belhadj"),
    ("Naftal Carburants & Lubrifiants", "commercial@naftal.dz", "+213 21 38 10 00", "Route des Dunes, Chéraga", "Alger", "001616004466880", "Cartes Carburant Flotte Pro & Gasoil Euro 5/6", "Mustapha Guellati"),
  ]

  fournisseurs = []
  for nom, eml, tel, adr, wil, nif, spec, cnt_nom in suppliers_data:
    fr = Fournisseur(
      id=uuid.uuid4(),
      nom_commercial=nom,
      email=eml,
      telephone_principal=tel,
      adresse=adr,
      wilaya=wil,
      commune=wil,
      code_postal="16000",
      nif=nif,
      specialite=spec,
      logo="/assets/partners/supplier_logo.jpg",
      statut_crm="Actif",
    )
    db.add(fr)
    db.flush()

    cnt = Contact(
      id=uuid.uuid4(),
      partenaire_id=fr.id,
      nom=cnt_nom.split()[0],
      prenom=cnt_nom.split()[1] if len(cnt_nom.split()) >1 else "",
      fonction="Responsable Grands Comptes",
      telephone=tel,
      email=eml,
      est_principal=True,
    )
    db.add(cnt)
    fournisseurs.append(fr)
  db.flush()

  # =========================================================================
  # 4. Seed 12 Contracts & Amendments
  # =========================================================================
  print("->Seeding 12 Contracts with active amendments...")
  contracts = []
  for i, cl in enumerate(clients):
    ctr = Contrat(
      id=uuid.uuid4(),
      reference=f"CTR-2026-{i+1:03d}",
      partenaire_id=cl.id,
      objet=f"Convention annuelle de transport de voyageurs et navettes pour {cl.nom_commercial}",
      type_contrat="Transport Voyageurs",
      date_debut=date(2026, 1, 1),
      date_fin=date(2026, 12, 31),
      montant=12000000.0 + (i * 1500000.0),
      devise="DZD",
      mode_facturation="Mensuel",
      conditions_paiement="Virement bancaire à 30 jours",
      statut=StatutContrat.ACTIF,
    )
    db.add(ctr)
    contracts.append(ctr)
  db.flush()

  # Add 4 Avenants
  for idx in range(4):
    c_target = contracts[idx]
    av = Avenant(
      id=uuid.uuid4(),
      contrat_id=c_target.id,
      numero=f"Avenant N°{idx+1:02d}",
      date=date(2026, 4, 15),
      objet=f"Extension kilométrique et ajout de navettes de week-end ({c_target.reference})",
      description="Revalorisation contractuelle selon barème kilométrique officiel.",
      modif_montant=1500000.0 + (idx * 500000.0),
      nouvelle_date_fin=date(2026, 12, 31),
    )
    db.add(av)
    c_target.montant += av.modif_montant
  db.flush()

  # =========================================================================
  # 5. Seed 16 Cautions Bancaires (Soumission & Bonne Exécution)
  # =========================================================================
  print("->Seeding 16 Bank Guarantees (Cautions BNA, CPA, BEA, BDL)...")
  banks = ["Banque Nationale d'Algérie (BNA Agence 612)", "Crédit Populaire d'Algérie (CPA Agence 104)", "Banque Extérieure d'Algérie (BEA Agence 201)", "Banque de Développement Local (BDL Agence 305)"]
  cautions_pdf_dir = Path(__file__).resolve().parent.parent / "frontend"/ "public"/ "assets"/ "documents"/ "cautions"
  cautions_pdf_dir.mkdir(parents=True, exist_ok=True)
  cautions = []
  for idx in range(16):
    c_type = TypeCaution.BONNE_EXECUTION if idx % 2 == 0 else TypeCaution.SOUMISSION
    cl = clients[idx % len(clients)]
    ctr = contracts[idx % len(contracts)] if c_type == TypeCaution.BONNE_EXECUTION else None
    caution_num = f"CAU-2026-{idx+1:03d}"

    # Write physical PDF file for frontend viewer
    cau_pdf_path = cautions_pdf_dir / f"caution_{caution_num}.pdf"
    if not cau_pdf_path.exists():
      with open(cau_pdf_path, "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF")

    cau = Caution(
      id=uuid.uuid4(),
      numero=caution_num,
      type=c_type,
      client_id=cl.id,
      contrat_id=ctr.id if ctr else None,
      montant=450000.0 + (idx * 120000.0),
      devise="DZD",
      reference_type="Contrat"if ctr else "Appel d'Offres",
      reference_numero=ctr.reference if ctr else f"AO-2026-{100+idx:03d}",
      objet=f"Garantie bancaire de {c_type.value.lower()} relative au marché {cl.nom_commercial}",
      date_emission=date(2026, 1, 10 + (idx % 20)),
      date_echeance=date(2026, 12, 31),
      banque_emetteur=banks[idx % len(banks)],
      statut=StatutCaution.CHEZ_CLIENT if idx < 12 else StatutCaution.CREATION,
      url_caution_pdf=f"/assets/documents/cautions/caution_{caution_num}.pdf",
    )
    db.add(cau)
    cautions.append(cau)
  db.flush()

  # =========================================================================
  # 6. Seed 22 Spare Parts (Stock)
  # =========================================================================
  print("->Seeding 22 Inventory Spare Parts & Warehousing Racks...")
  parts_data = [
    ("FIL-001", "Filtre à huile Mercedes Tourismo OM470", "Filtres", "Mann-Filter", "Mercedes Tourismo / Travego", "Pièce", 25, 10, "A-03-02", "Filtre à huile haute performance"),
    ("FIL-002", "Filtre à gazole avec séparateur d'eau Iveco", "Filtres", "Bosch", "Iveco Crossway", "Pièce", 18, 8, "A-03-04", "Séparateur haute efficacité"),
    ("FIL-003", "Filtre à air moteur Scania Touring HD", "Filtres", "Donaldson", "Scania Touring HD", "Pièce", 12, 6, "A-02-01", "Filtre à air haute capacité"),
    ("FIL-004", "Filtre d'habitacle antibactérien climatisation Bus", "Filtres", "Mann-Filter", "Universel Autocars", "Pièce", 30, 15, "A-01-05", "Filtration pollen et particules"),
    ("FRE-001", "Jeu Plaquettes de frein avant Knorr-Bremse", "Freinage", "Knorr-Bremse", "Iveco Crossway / Mercedes Bus", "Jeu", 6, 10, "B-01-04", "Plaquettes haute endurance"),
    ("FRE-002", "Jeu Plaquettes de frein arrière Wabco", "Freinage", "Wabco", "Mercedes Tourismo / MAN", "Jeu", 8, 10, "B-01-06", "Endurance essieu arrière"),
    ("FRE-003", "Disque de frein ventilé 430mm Essieu Avant", "Freinage", "Brembo", "Mercedes Tourismo / Travego", "Pièce", 4, 4, "B-02-02", "Disque ventilé fonte haute résistance"),
    ("FRE-004", "Valve de commande frein de stationnement pneumatique", "Freinage", "Wabco", "Iveco / MAN / Scania", "Pièce", 5, 3, "B-03-01", "Robinet de commande pneumatique"),
    ("ELEC-001", "Batterie Heavy Duty 12V 225Ah 1150A", "Électricité", "Varta", "Universel Bus & Autocars", "Pièce", 14, 6, "C-01-01", "Batterie poids lourds anti-vibration"),
    ("ELEC-002", "Alternateur 28V 150A avec régulateur", "Électricité", "Bosch", "Mercedes-Benz OM470", "Pièce", 3, 2, "C-02-03", "Alternateur haute intensité"),
    ("ELEC-003", "Démarreur 24V 5.5kW Réducteur", "Électricité", "Prestolite", "Iveco Cursor 9 / MAN D26", "Pièce", 4, 2, "C-02-05", "Démarreur couple renforcé"),
    ("ELEC-004", "Optique de phare LED gauche avec clignotant", "Électricité", "Hella", "Mercedes Tourismo 2022", "Pièce", 2, 2, "C-03-02", "Projecteur principal LED"),
    ("PNEU-001", "Pneu 295/80 R22.5 Michelin X Coach Z", "Pneumatiques", "Michelin", "Autocars Toutes Positions", "Pièce", 16, 8, "D-01-01", "Pneu tourisme autoroutier été/hiver"),
    ("PNEU-002", "Pneu 215/75 R17.5 Bridgestone Duravis", "Pneumatiques", "Bridgestone", "Minibus Hyundai / Coaster", "Pièce", 12, 6, "D-02-01", "Pneu minibus renforcé"),
    ("SUSP-001", "Coussin de suspension pneumatique arrière", "Suspension", "ContiTech", "Mercedes Tourismo / Setra", "Pièce", 8, 4, "E-01-02", "Diaphragme d'air haute résistance"),
    ("SUSP-002", "Amortisseur hydraulique avant renforcé", "Suspension", "Sachs", "Iveco Crossway", "Pièce", 6, 4, "E-01-04", "Amortisseur de confort voyageur"),
    ("FLUI-001", "Fût Huile Moteur Total Rubia Tir 8900 10W-40 (208L)", "Fluides", "TotalEnergies", "Moteurs Euro 5 & 6", "Fût", 5, 2, "F-01-01", "Lubrifiant Low-SAPS synthèse"),
    ("FLUI-002", "Bidon Liquide de refroidissement Glacelf -35°C (20L)", "Fluides", "TotalEnergies", "Tous Véhicules", "Bidon", 20, 8, "F-02-01", "Protection anti-corrosion organique"),
    ("FLUI-003", "Bidon Liquide AdBlue Euro 6 (10L)", "Fluides", "TotalEnergies", "Moteurs SCR Euro 6", "Bidon", 45, 15, "F-03-01", "Agent réducteur NOx certifié"),
    ("MOT-001", "Courroie d'accessoires striée 8PK2145", "Moteur", "Gates", "Mercedes OM470 / OM936", "Pièce", 10, 5, "A-04-01", "Courroie trapézoïdale poly-V"),
    ("MOT-002", "Pompe à eau moteur complète avec joint", "Moteur", "Dolz", "Iveco Cursor 9", "Pièce", 3, 2, "A-04-03", "Turbine haute pression"),
    ("CAR-001", "Rétroviseur grand angle chauffant électrique droit", "Carrosserie", "Mekra", "Mercedes Tourismo / Iveco", "Pièce", 2, 2, "B-04-01", "Miroir vision intégrale dégivrant"),
  ]

  pieces = []
  for ref, des, cat, mrq, mdl, uni, stk, stk_min, emp, descrip in parts_data:
    p = Piece(
      id=uuid.uuid4(),
      reference=ref,
      designation=des,
      categorie=cat,
      marque=mrq,
      modele_compatibilite=mdl,
      unite=uni,
      stock_actuel=stk,
      stock_minimum=stk_min,
      emplacement=emp,
      description=descrip,
    )
    db.add(p)
    pieces.append(p)
  db.flush()

  # Initial Stock Delivery Entries
  for p in pieces:
    mvt_in = MouvementStock(
      id=uuid.uuid4(),
      piece_id=p.id,
      type=TypeMouvement.ENTREE,
      quantite=p.stock_actuel + 5,
      date=date(2026, 8, 1),
      motif="Réception fournisseur - Approvisionnement magasin central",
      fournisseur_id=fournisseurs[0].id,
      reference_document=f"BL-2026-{uuid.uuid4().hex[:6].upper()}",
    )
    db.add(mvt_in)
  db.flush()

  # =========================================================================
  # 7. Seed 32 Maintenance Interventions with Consumed Parts
  # =========================================================================
  print("->Seeding 32 Maintenance Work Orders (Preventive & Corrective)...")
  interventions = []
  for i in range(32):
    v = vehicules[i % len(vehicules)]
    mec = mecaniciens[i % len(mecaniciens)]
    is_prev = (i % 2 == 0)
    num_int = f"INT-2026-{i+1:04d}"

    inter = Intervention(
      id=uuid.uuid4(),
      numero=num_int,
      vehicule_id=v.id,
      mecanicien_responsable_id=mec.id,
      type=CategorieIntervention.PREVENTIVE if is_prev else CategorieIntervention.CORRECTIVE,
      categorie="Révision & Vidange"if is_prev else "Freinage & Pneumatiques",
      date=date(2026, 8, 1 + (i % 12)),
      kilometrage=v.kilometrage_actuel - (1500.0 * (32 - i)),
      probleme_constate="Entretien périodique programmé"if is_prev else "Vibrations anormales au freinage et alerte tableau de bord",
      diagnostic="Contrôle conforme et remplacement consommables d'usage"if is_prev else "Usure importante des garnitures et disques",
      travail_effectue="Vidange complète moteur, remplacement filtres et contrôle des niveaux"if is_prev else "Remplacement jeu de plaquettes, purge circuit et essai sur banc",
      cout_total=25000.0 + (i * 3500.0),
      prochaine_date_maintenance=date(2026, 11, 1 + (i % 12)),
      prochain_kilo_maintenance=v.kilometrage_actuel + 15000.0,
      statut=StatutIntervention.TERMINEE,
    )
    db.add(inter)
    db.flush()

    # Link consumed parts
    p_used = pieces[i % len(pieces)]
    qty_used = 1 if p_used.unite in ("Fût", "Jeu") else 2

    db.execute(
      insert(intervention_pieces).values(
        intervention_id=inter.id,
        piece_id=p_used.id,
        quantite_utilisee=qty_used,
      )
    )

    mvt_out = MouvementStock(
      id=uuid.uuid4(),
      piece_id=p_used.id,
      type=TypeMouvement.SORTIE,
      quantite=qty_used,
      date=inter.date,
      motif=f"Intervention atelier {inter.numero}",
      intervention_id=inter.id,
      reference_document=f"OT-{inter.numero}",
    )
    db.add(mvt_out)

    # Link secondary mechanic
    sec_mec = mecaniciens[(i + 1) % len(mecaniciens)]
    db.execute(
      insert(intervention_mecaniciens).values(
        intervention_id=inter.id,
        mecanicien_id=sec_mec.id,
      )
    )

    interventions.append(inter)
  db.flush()

  # =========================================================================
  # 8. Seed 20 Quotations (Devis) & Conversions
  # =========================================================================
  print("->Seeding 20 Commercial Quotes (Devis)...")
  devis_list = []
  for i in range(20):
    cl = clients[i % len(clients)]
    num_dev = f"DEV-2026-{i+1:03d}"
    ht = 180000.0 + (i * 25000.0)
    tva = ht * 0.19
    ttc = ht + tva
    st = StatutDevis.ACCEPTE if i < 10 else (StatutDevis.ENVOYE if i < 16 else StatutDevis.BROUILLON)

    dev = Devis(
      id=uuid.uuid4(),
      numero=num_dev,
      client_id=cl.id,
      contrat_id=contracts[i % len(contracts)].id if st == StatutDevis.ACCEPTE else None,
      date_emission=date(2026, 8, 1 + (i % 10)),
      date_validite=date(2026, 8, 31),
      statut=st,
      objet=f"Proposition transport circuits et liaisons express {cl.nom_commercial}",
      conditions_reglement="Règlement à 30 jours par virement bancaire BNA Agence 612.",
      total_ht=ht,
      taux_tva=19.0,
      montant_tva=tva,
      total_ttc=ttc,
    )
    db.add(dev)
    db.flush()

    dl = DevisLigne(
      id=uuid.uuid4(),
      devis_id=dev.id,
      service="Transport Voyageurs & Équipage",
      description=f"Prestation d'acheminement autocar grand tourisme climatisé ({cl.nom_commercial})",
      quantite=1.0,
      prix_unitaire=ht,
      total_ligne=ht,
    )
    db.add(dl)
    devis_list.append(dev)
  db.flush()

  # =========================================================================
  # 9. Seed 16 Invoices & Multi-payment Ledger
  # =========================================================================
  print("->Seeding 16 Customer Invoices & Cash Collections Ledger...")
  factures = []
  for i in range(16):
    cl = clients[i % len(clients)]
    num_inv = f"INV-2026-{i+1:03d}"
    ht = 200000.0 + (i * 30000.0)
    tva = ht * 0.19
    ttc = ht + tva

    if i < 6:
      st = StatutFacture.PAYE
      paye = ttc
      restant = 0.0
    elif i < 12:
      st = StatutFacture.PARTIEL
      paye = ttc * 0.5
      restant = ttc - paye
    else:
      st = StatutFacture.EN_ATTENTE
      paye = 0.0
      restant = ttc

    fac = Facture(
      id=uuid.uuid4(),
      numero=num_inv,
      client_id=cl.id,
      contrat_id=contracts[i % len(contracts)].id,
      date_emission=date(2026, 8, 1 + (i % 10)),
      date_echeance=date(2026, 9, 1 + (i % 10)),
      statut=st,
      mode_reglement=ModePaiement.VIREMENT,
      total_ht=ht,
      taux_tva=19.0,
      montant_tva=tva,
      total_ttc=ttc,
      montant_paye=paye,
      montant_restant=restant,
      notes=f"Facture officielle relative aux prestations exécutées pour {cl.nom_commercial}.",
    )
    db.add(fac)
    db.flush()

    fl = FactureLigne(
      id=uuid.uuid4(),
      facture_id=fac.id,
      service="Prestation d'Exploitation Transport",
      description="Exécution liaison régulière navettes personnel et délégations",
      quantite=1.0,
      prix_unitaire=ht,
      total_ligne=ht,
    )
    db.add(fl)

    if paye >0:
      pay = Paiement(
        id=uuid.uuid4(),
        facture_id=fac.id,
        date=fac.date_emission + timedelta(days=3),
        montant=paye,
        mode=ModePaiement.VIREMENT,
        reference=f"VIR-BNA-{1000+i:04d}",
        banque="Banque Nationale d'Algérie (BNA)",
        statut=StatutPaiement.VALIDE,
        notes="Encaissement validé",
      )
      db.add(pay)

    factures.append(fac)
  db.flush()

  # =========================================================================
  # 10. Seed 18 Travel Missions
  # =========================================================================

  # =========================================================================
  # 11. Seed Vehicle Expenses for TCO
  # =========================================================================
  print("->Seeding Vehicle TCO Expenses (Carburant, Assurances, Péages)...")
  for idx, v in enumerate(vehicules):
    # Fuel
    db.add(
      DepenseVehicule(
        id=uuid.uuid4(),
        vehicule_id=v.id,
        categorie=CategorieDepenseVehicule.CARBURANT,
        date=date(2026, 8, 5),
        montant=35000.0 + (idx * 2000.0),
        kilometrage=v.kilometrage_actuel - 500.0,
        fournisseur="Naftal Station Autoroute Est-Ouest",
        notes="Plein gasoil 450L",
      )
    )
    # Insurance
    db.add(
      DepenseVehicule(
        id=uuid.uuid4(),
        vehicule_id=v.id,
        categorie=CategorieDepenseVehicule.ASSURANCE,
        date=date(2026, 1, 1),
        montant=115000.0 + (idx * 5000.0),
        fournisseur="CAAT Compagnie d'Assurance",
        notes="Police d'assurance tous risques flotte",
      )
    )
    # Taxe & Vignette
    db.add(
      DepenseVehicule(
        id=uuid.uuid4(),
        vehicule_id=v.id,
        categorie=CategorieDepenseVehicule.AUTRE,
        date=date(2026, 3, 15),
        montant=20000.0,
        fournisseur="Trésor Public Algérien",
        notes="Vignette automobile annuelle",
      )
    )

  # =========================================================================
  # 12. Seed Universal Documents with Physical Test Files
  # =========================================================================
  print("->Seeding Universal Compliance Documents with physical test files...")
  upload_base = Path("uploads").resolve()
  upload_base.mkdir(parents=True, exist_ok=True)

  # Sample PDF minimal bytes
  sample_pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"

  # Sample PNG 1x1 minimal transparent pixel bytes
  sample_png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

  # 12.1 Vehicle Documents
  for idx, v in enumerate(vehicules):
    v_dir = upload_base / "vehicule"/ str(v.id)
    v_dir.mkdir(parents=True, exist_ok=True)

    # Assurance
    assur_file = v_dir / f"assurance_{v.immatriculation.replace('-', '_')}.pdf"
    with open(assur_file, "wb") as f:
      f.write(sample_pdf_content)

    db.add(
      Document(
        id=uuid.uuid4(),
        nom=f"Police d'assurance Flotte 2026 ({v.immatriculation})",
        type="Assurance",
        document_type="Assurance",
        filename=assur_file.name,
        file_path=str(assur_file),
        url_fichier=f"/api/v1/documents/{v.id}/view",
        mime_type="application/pdf",
        size=len(sample_pdf_content),
        uploaded_by="admin",
        uploaded_at=datetime(2026, 1, 15, 9, 30),
        description=f"Contrat tous risques flotte avec CAAT Assurance",
        date_emission=date(2026, 1, 1),
        date_expiration=date(2026, 12, 31),
        statut_validite="Valide",
        entity_type="vehicule",
        entity_id=v.id,
      )
    )

    # Carte Grise
    cg_file = v_dir / f"carte_grise_{v.immatriculation.replace('-', '_')}.pdf"
    with open(cg_file, "wb") as f:
      f.write(sample_pdf_content)

    db.add(
      Document(
        id=uuid.uuid4(),
        nom=f"Carte Grise Officielle ({v.immatriculation})",
        type="Carte Grise",
        document_type="Carte Grise",
        filename=cg_file.name,
        file_path=str(cg_file),
        url_fichier=f"/api/v1/documents/{v.id}/view",
        mime_type="application/pdf",
        size=len(sample_pdf_content),
        uploaded_by="admin",
        uploaded_at=datetime(2026, 1, 15, 9, 35),
        description="Certificat d'immatriculation délivré par la Wilaya d'Alger",
        date_emission=date(2022, 3, 15),
        statut_validite="Valide",
        entity_type="vehicule",
        entity_id=v.id,
      )
    )

  # 12.2 Employee Documents
  for idx, ch in enumerate(chauffeurs):
    ch_dir = upload_base / "employe"/ str(ch.id)
    ch_dir.mkdir(parents=True, exist_ok=True)

    # Permis
    perm_file = ch_dir / f"permis_conduire_{ch.matricule.lower()}.pdf"
    with open(perm_file, "wb") as f:
      f.write(sample_pdf_content)

    db.add(
      Document(
        id=uuid.uuid4(),
        nom=f"Permis de Conduire ({ch.nom} {ch.prenom})",
        type="Permis de Conduire",
        document_type="Permis de Conduire",
        filename=perm_file.name,
        file_path=str(perm_file),
        url_fichier=f"/api/v1/documents/{ch.id}/view",
        mime_type="application/pdf",
        size=len(sample_pdf_content),
        uploaded_by="admin",
        uploaded_at=datetime(2026, 2, 1, 10, 0),
        description="Copie certifiée conforme du permis de conduire professionnel",
        date_emission=date(2020, 1, 1),
        date_expiration=date(2028, 6, 15),
        statut_validite="Valide",
        entity_type="employe",
        entity_id=ch.id,
      )
    )

  # 12.3 Partner Documents (RC, NIF)
  for idx, cl in enumerate(clients):
    cl_dir = upload_base / "partenaire"/ str(cl.id)
    cl_dir.mkdir(parents=True, exist_ok=True)

    rc_file = cl_dir / f"registre_commerce_{idx+1}.pdf"
    with open(rc_file, "wb") as f:
      f.write(sample_pdf_content)

    db.add(
      Document(
        id=uuid.uuid4(),
        nom=f"Extrait Registre de Commerce — {cl.nom_commercial}",
        type="Registre de Commerce",
        document_type="Registre de Commerce",
        filename=rc_file.name,
        file_path=str(rc_file),
        url_fichier=f"/api/v1/documents/{cl.id}/view",
        mime_type="application/pdf",
        size=len(sample_pdf_content),
        uploaded_by="admin",
        uploaded_at=datetime(2026, 1, 10, 14, 0),
        description=f"Extrait RC CNRC {cl.registre_commerce} et identification fiscale",
        date_emission=date(2025, 1, 1),
        statut_validite="Valide",
        entity_type="partenaire",
        entity_id=cl.id,
      )
    )

  # 12.4 Contract Documents
  for idx, ctr in enumerate(contracts):
    ctr_dir = upload_base / "contrat"/ str(ctr.id)
    ctr_dir.mkdir(parents=True, exist_ok=True)

    ctr_file = ctr_dir / f"contrat_signe_{ctr.reference.lower().replace('/', '_')}.pdf"
    with open(ctr_file, "wb") as f:
      f.write(sample_pdf_content)

    db.add(
      Document(
        id=uuid.uuid4(),
        nom=f"Convention Marché Paraphée ({ctr.reference})",
        type="Contrat Signé",
        document_type="Contrat Signé",
        filename=ctr_file.name,
        file_path=str(ctr_file),
        url_fichier=f"/api/v1/documents/{ctr.id}/view",
        mime_type="application/pdf",
        size=len(sample_pdf_content),
        uploaded_by="admin",
        uploaded_at=datetime(2026, 1, 20, 11, 30),
        description=f"Exemplaire original paraphé et signé avec {ctr.partenaire.nom_commercial if ctr.partenaire else 'Client'}",
        date_emission=ctr.date_debut,
        date_expiration=ctr.date_fin,
        statut_validite="Valide",
        entity_type="contrat",
        entity_id=ctr.id,
      )
    )

  db.commit()
  print("[SUCCESS] Complete Enterprise ERP Database successfully seeded with verified relational datasets and physical test files!")


if __name__ == "__main__":
  session = SessionLocal()
  seed_database(session)
  session.close()
