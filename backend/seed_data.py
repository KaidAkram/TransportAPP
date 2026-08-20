"""
Schema seed — inserts demo data into an EMPTY database.
Used by entrypoint.py on startup.  No DROP, no CREATE — just inserts.
"""
import os, sys, random, uuid
from datetime import date, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import Base
import app.models
from app.models import (
    Employe, Vehicule, Chauffeur, Mecanicien, Permis,
    Partenaire, Client, Fournisseur, Contact, CRMNote,
    Contrat, Avenant, Caution,
    Piece, MouvementStock, Reception, ReceptionLigne, Intervention,
    Facture, DepenseVehicule, Constat, Document,
)
from app.models.enums import *


def _u(): return uuid.uuid4()
def _d(y,m,day): return date(y,m,day)
def _dp(days): return date.today() - timedelta(days=days)
def _dr(days): return date.today() + timedelta(days=days)


def seed_database(db_url: str):
    """Insert comprehensive demo data.  Safe to call only on empty tables."""
    engine = create_engine(db_url, echo=False)

    with Session(engine) as db:
        count = db.execute(text("SELECT COUNT(*) FROM vehicules")).scalar()
        if count and count > 0:
            print("[seed] Database already has data — skipping.")
            return

        print("[seed] Seeding database with demo data...")

        # ── VEHICULES ──────────────────────────────────────────────
        veh_raw = [
            ("16245_A_18","Mercedes","Sprinter 519","Minibus",20,2022,145000,"DISPONIBLE"),
            ("17890_B_16","Renault","Master L3H2","Minibus",16,2021,198000,"DISPONIBLE"),
            ("08976_D_12","Hyundai","County","Minibus",24,2020,235000,"DISPONIBLE"),
            ("05123_C_07","Iveco","Daily 50C18","Bus",30,2023,87000,"EN_MISSION"),
            ("02345_F_05","MAN","TGL 12.250","Bus",45,2019,310000,"EN_MISSION"),
            ("15678_L_11","Scania","Irizar i8","Bus",48,2023,95000,"EN_MISSION"),
            ("19034_E_22","Toyota","Coaster","Minibus",22,2024,32000,"MAINTENANCE"),
            ("09123_M_17","Toyota","Hilux 4x4","Voiture",5,2024,12000,"MAINTENANCE"),
            ("11234_J_20","Fiat","Ducato Maxi","Van",9,2022,112000,"IMMOBILISE"),
            ("03456_K_03","Volvo","9700","Bus",52,2021,275000,"HORS_SERVICE"),
            ("14567_G_14","Renault","Trafic Van","Van",9,2023,45000,"DISPONIBLE"),
            ("07891_H_09","Mercedes","Sprinter 313 CDI","Van",8,2024,18000,"DISPONIBLE"),
            ("20001_N_01","Renault","Master Box","Van",3,2025,8000,"DISPONIBLE"),
            ("20002_P_02","Citroen","Jumper Utility","Van",3,2025,5000,"DISPONIBLE"),
            ("20003_Q_03","Peugeot","Boxer Combi","Minibus",9,2025,3000,"DISPONIBLE"),
        ]
        vehicules = []
        for imm,marque,modele,tp,nb,an,km,st in veh_raw:
            v = Vehicule(id=_u(),immatriculation=imm,marque=marque,modele=modele,type=tp,
                nombre_places=nb,annee=an,date_mise_circulation=_d(an,random.randint(1,6),random.randint(1,28)),
                kilometrage_actuel=km,statut=StatutVehicule[st],cout_total=round(random.uniform(50000,800000),2))
            db.add(v); vehicules.append(v)
        db.flush()

        # ── EMPLOYES ───────────────────────────────────────────────
        chauffeurs = []
        for mat,nom,pre,naiss,tel,adr,emb,cat,assur,st in [
            ("CHF-001","Benali","Karim",_d(1985,3,15),"0555123456","Rue Didouche Mourad, Alger",_d(2018,4,1),"Cat D",True,"ACTIF"),
            ("CHF-002","Mebarki","Youcef",_d(1990,7,22),"0661234567","Cite 1000 logements, Oran",_d(2019,9,15),"Cat D, D1",True,"ACTIF"),
            ("CHF-003","Hadj","Mohamed",_d(1982,11,8),"0770345678","Bd Krim Belkacem, Alger",_d(2016,2,10),"Cat B, D",True,"ACTIF"),
            ("CHF-004","Slimani","Abdelkader",_d(1988,1,30),"0555456789","Rue de la Republique, Constantine",_d(2020,6,1),"Cat D",True,"ACTIF"),
            ("CHF-005","Bouzid","Amine",_d(1993,5,12),"0661567890","Lot Bouchaoui, Tipaza",_d(2022,1,20),"Cat D, D1",True,"ACTIF"),
            ("CHF-006","Khelifi","Samir",_d(1987,9,3),"0770678901","Rue Ahmed Bey, Blida",_d(2017,11,5),"Cat B, D",True,"ABSENT"),
            ("CHF-010","Tlemcani","Rachid",_d(1991,2,18),"0555789012","Cite AADL, Annaba",_d(2021,3,12),"Cat D",True,"ABSENT"),
            ("CHF-007","Ferdi","Nassim",_d(1995,8,25),"0661890123","Rue Principale, Setif",_d(2023,6,1),"Cat D",False,"SUSPENDU"),
            ("CHF-008","Djaballah","Hichem",_d(1989,4,7),"0770901234","Bd Emir Abdelkader, Tlemcen",_d(2015,3,1),"Cat B, D",True,"QUITTE"),
        ]:
            c = Chauffeur(id=_u(),matricule=mat,nom=nom,prenom=pre,date_naissance=naiss,
                telephone=tel,adresse=adr,date_embauche=emb,statut=StatutEmploye[st],
                type_employe=TypeEmploye.CHAUFFEUR,fonction=cat,assurance=assur)
            db.add(c); chauffeurs.append(c)
        db.flush()
        for c in chauffeurs:
            db.add(Permis(id=_u(),chauffeur_id=c.id,numero=f"PERM-{random.randint(100000,999999)}",
                categories="B, D, D1",date_obtention=c.date_embauche-timedelta(days=random.randint(365,2000)),
                date_expiration=date.today()+timedelta(days=random.randint(-30,1800))))
        db.flush()

        mecaniciens = []
        for mat,nom,pre,naiss,tel,adr,emb,spec,resp,st in [
            ("MEC-001","Charef","Djamel",_d(1980,6,25),"0555111222","Rue Abane Ramdane, Alger",_d(2015,8,1),"Mecanique generale",True,"ACTIF"),
            ("MEC-002","Zeroual","Nabil",_d(1992,4,14),"0661222333","Lot 500 logements, Oran",_d(2020,2,1),"Electromecanique",True,"ACTIF"),
            ("MEC-003","Derriche","Samir",_d(1986,8,9),"0770333444","Cite Ben Aknoun, Alger",_d(2017,5,15),"Carrosserie",False,"ACTIF"),
            ("MEC-004","Zerhouni","Khaled",_d(1994,1,20),"0555444555","Zone industrielle, Oran",_d(2022,9,1),"Pneumatique",False,"ABSENT"),
            ("MEC-005","Taleb","Farid",_d(1983,12,3),"0661555666","Rue Didouche, Constantine",_d(2018,4,1),"Mecanique generale",True,"SUSPENDU"),
        ]:
            m = Mecanicien(id=_u(),matricule=mat,nom=nom,prenom=pre,date_naissance=naiss,
                telephone=tel,adresse=adr,date_embauche=emb,statut=StatutEmploye[st],
                type_employe=TypeEmploye.MECANICIEN,specialite=spec,est_responsable=resp)
            db.add(m); mecaniciens.append(m)
        db.flush()

        for mat,nom,pre,naiss,tel,adr,emb,st in [
            ("ADM-001","Bensalem","Fatima",_d(1990,12,1),"0555000111","Alger Centre",_d(2019,1,1),"ACTIF"),
            ("ADM-002","Aoudia","Lyes",_d(1988,8,20),"0661000222","Hydra, Alger",_d(2018,6,1),"ACTIF"),
            ("ADM-003","Megueddem","Sara",_d(1996,3,8),"0770000333","Ben Aknoun, Alger",_d(2023,9,1),"ABSENT"),
            ("ADM-004","Noui","Walid",_d(1985,11,15),"0555000444","Bab Ezzouar, Alger",_d(2020,3,1),"QUITTE"),
        ]:
            db.add(Employe(id=_u(),matricule=mat,nom=nom,prenom=pre,date_naissance=naiss,
                telephone=tel,adresse=adr,date_embauche=emb,statut=StatutEmploye[st],
                type_employe=TypeEmploye.ADMINISTRATIF))
        db.flush()

        # ── PARTENAIRES ────────────────────────────────────────────
        clients = []
        for nom,tp,nif,nis,adr,wil,com,cp,tel,email in [
            ("SONATRACH","ENTREPRISE","0987654321","1234567890","Hassi Messaoud, Ouargla","Ouargla","Hassi Messaoud","30000","0297654321","contact@sonatrach.dz"),
            ("SONELGAZ","ENTREPRISE","0987654322","1234567891","Rue Larbi Ben M'Hidi, Alger","Alger","Sidi M'Hamed","16000","021634567","info@sonelgaz.dz"),
            ("ALGERIE TELECOM","ENTREPRISE","0987654323","1234567892","Cite Ali Mendjeli, Constantine","Constantine","Ali Mendjeli","25000","031812345","contact@telecom.dz"),
            ("ENTP BTP SPA","ENTREPRISE","0987654324","1234567893","Rue Didouche Mourad, Alger","Alger","Hussein Dey","16000","021789012","direction@entpbtp.dz"),
            ("SONACOM","ENTREPRISE","0987654325","1234567894","Zone industrielle, Oran","Oran","Bir El Djir","31000","041567890","info@sonacom.dz"),
            ("HOTEL EL BARAKA","HOTEL","0987654327","1234567896","Bd Emir Abdelkader, Alger","Alger","Sidi Fredj","16000","021901234","reservation@elbaraka.dz"),
            ("RADISSON BLU ORAN","HOTEL","0987654330","1234567899","Front de Mer, Oran","Oran","Oran Centre","31000","041234567","info@radisson-oran.dz"),
            ("ETAP","ORGANISME","0987654328","1234567897","Boulevard Khemisti, Alger","Alger","Bab Ezzouar","16005","021912345","info@etap.dz"),
            ("BENMANSOUR SARL","PARTICULIER","0987654329","1234567898","Rue Principale, Tipaza","Tipaza","Kolea","42000","024567890","contact@benmansour.dz"),
            ("SYNDICAT TRANSPORT","ASSOCIATION","0987654331","123456789A","Avenue de la Liberte, Alger","Alger","Alger Centre","16000","021456789","syndicat@transport.dz"),
            ("TELECARBONE DZ","AUTRE","0987654332","123456789B","Zone Franche, Oran","Oran","Es Senia","31000","041678901","info@telecarbone.dz"),
            ("CIMA VERRE","ENTREPRISE","0987654333","123456789C","Zone industrielle, Mostaganem","Mostaganem","Sidi Said","27000","045345678","contact@cima-verre.dz"),
            ("EURL TRANSPORT OUEST","ENTREPRISE","0987654326","1234567895","Rue Front de Mer, Oran","Oran","Oran Centre","31000","041345678","contact@transportouest.dz"),
            ("SOCIETE BATIMENT MOD","ENTREPRISE","0987654334","123456789D","Lot Targa, Blida","Blida","Targa","09000","025456789","contact@batimentmoderne.dz"),
            ("GROUPE DAHMANI","ENTREPRISE","0987654335","123456789E","Bd Emir Abdelkader, Tlemcen","Tlemcen","Tlemcen Centre","13000","043234567","info@groupe-dahmani.dz"),
        ]:
            c = Client(id=_u(),nom_commercial=nom,nif=nif,nis=nis,
                registre_commerce=f"RC-{random.randint(100000,999999)}",
                article_imposition=f"AI-{random.randint(10000,99999)}",
                adresse=adr,wilaya=wil,commune=com,code_postal=cp,
                telephone_principal=tel,email=email,role_partenaire=RolePartenaire.CLIENT,
                type_client=TypePartenaire[tp],statut_crm=random.choice(["Actif","Actif","Actif","Prospect"]))
            db.add(c); clients.append(c)
        db.flush()

        fournisseurs = []
        for nom,spec,nif,nis,adr,wil,com,cp,tel,email in [
            ("TOTAL ALGERIE","Carburant & Lubrifiants","0987000001","0310010001","Rue Col. Lotfi, Alger","Alger","Bab Ezzouar","16005","021810000","contact@totalalg.dz"),
            ("OPTIMUS PIECES AUTO","Pieces detachees","0987000002","0310010002","Zone ind. Hassi Ameur, Tipaza","Tipaza","Hassi Ameur","42007","024890000","vente@optimusauto.dz"),
            ("SAFETY TRANS IT","Equipements de securite","0987000003","0310010003","Lot 1036, Dely Ibrahim","Alger","Dely Ibrahim","16320","021915000","info@safetytrans.dz"),
            ("FILTRALGERIE","Filtration industrielle","0987000004","0310010004","Zone Franche, Oran","Oran","Es Senia","31000","041900000","info@filtralgerie.dz"),
            ("ALGERIE PNEUMATIQUE","Pneumatiques","0987000005","0310010005","Rue Didouche Mourad, Alger","Alger","Hussein Dey","16000","021760000","vente@pneumatique.dz"),
            ("BATICAL SPA","Peinture & Traitements","0987000006","0310010006","Zone industrielle, Blida","Blida","Mouzaia","09000","025470000","info@batical.dz"),
            ("PARTENAIRE MIXTE SA","Transport & Logistique","0987000007","0310010007","Front de Mer, Oran","Oran","Oran Centre","31000","041550000","contact@partenairemixte.dz"),
        ]:
            f = Fournisseur(id=_u(),nom_commercial=nom,nif=nif,nis=nis,
                adresse=adr,wilaya=wil,commune=com,code_postal=cp,
                telephone_principal=tel,email=email,role_partenaire=RolePartenaire.FOURNISSEUR,
                specialite=spec,statut_crm="Actif")
            db.add(f); fournisseurs.append(f)

        db.add(Partenaire(id=_u(),nom_commercial="TRANS-MIXTE ALGERIE",
            nif="0987000008",nis="0310010008",adresse="Bd Emir Abdelkader, Oran",
            wilaya="Oran",commune="Oran Centre",code_postal="31000",
            telephone_principal="041110000",email="mixte@transmixte.dz",
            role_partenaire=RolePartenaire.PARTENAIRE_MIXTE,statut_crm="Actif"))
        db.flush()

        # ── CONTACTS + CRM NOTES ───────────────────────────────────
        for c in clients[:8]:
            db.add(Contact(id=_u(),partenaire_id=c.id,nom="Direction",prenom="General",
                fonction="Directeur General",telephone=c.telephone_principal,email=c.email,est_principal=True))
            if random.random()>0.4:
                db.add(Contact(id=_u(),partenaire_id=c.id,nom="Comptabilite",prenom="Service",
                    fonction="Resp. Comptabilite",telephone=f"021{random.randint(100000,999999)}",
                    email=f"compta@{c.nom_commercial.lower().replace(' ','')}.dz",est_principal=False))
        db.flush()
        for c in clients:
            for _ in range(random.randint(1,4)):
                db.add(CRMNote(id=_u(),partenaire_id=c.id,type=random.choice(["Appel","Email","Reunion","Note"]),
                    auteur="Administrateur",date=_dp(random.randint(1,120)),
                    contenu=random.choice([
                        "Discussion sur les conditions du contrat",
                        "Email envoye - devis pour prestation de transport",
                        "Reunion au siege - presentation de notre flotte",
                        "Client satisfait, renouvellement prevu",
                        "Relance pour validation du bon de commande",
                    ])))
        db.flush()

        # ── CONTRATS ───────────────────────────────────────────────
        contrats = []
        for ref,ci,obj,tc,dd,dm,mt,st in [
            ("CTR-2026-001",0,"Transport du personnel SITE <-> USINE","Transport",_d(2026,1,1),_d(2026,12,31),18500000,"ACTIF"),
            ("CTR-2026-002",1,"Location minibars pour navettes internes","Location",_d(2026,3,1),_d(2027,2,28),9600000,"ACTIF"),
            ("CTR-2025-003",2,"Prestation de transport interurbain","Transport",_d(2025,6,15),_d(2026,6,14),24000000,"ACTIF"),
            ("CTR-2025-004",3,"Transport de chantier - materiel et personnel","Transport",_d(2025,9,1),_d(2026,8,31),7200000,"EXPIRE"),
            ("CTR-2026-005",4,"Service de messagerie inter-villes","Logistique",_d(2026,2,1),_d(2027,1,31),5400000,"ACTIF"),
            ("CTR-2024-006",5,"Contrat cadre transport voyageurs annuel","Transport",_d(2024,4,1),_d(2025,3,31),36000000,"EXPIRE"),
            ("CTR-2026-007",6,"Shuttle service hotel <-> aeroport","Transport",_d(2026,5,1),_d(2027,4,30),3600000,"ACTIF"),
            ("CTR-2026-008",7,"Fourniture et transport materiel de construction","Logistique",_d(2026,1,15),_d(2026,12,15),12000000,"ACTIF"),
            ("CTR-2025-009",8,"Transport biens equipements industriels","Transport",_d(2025,3,1),_d(2026,2,28),8400000,"EXPIRE"),
            ("CTR-2026-010",9,"Contrat syndical transport employes","Transport",_d(2026,1,1),_d(2027,12,31),4200000,"ACTIF"),
            ("CTR-2026-011",10,"Distribution carbone et logistique","Logistique",_d(2026,6,1),_d(2027,5,31),2800000,"ACTIF"),
            ("CTR-2026-012",11,"Transport verre et materiaux fragiles","Transport",_d(2026,4,1),_d(2027,3,31),6000000,"ACTIF"),
            ("CTR-2023-013",12,"Contrat historique transport general","Transport",_d(2023,1,1),_d(2023,12,31),15000000,"EXPIRE"),
            ("CTR-2026-014",13,"Service transport chantier BTP","Transport",_d(2026,2,15),_d(2027,2,14),9800000,"ACTIF"),
            ("CTR-2024-015",14,"Contrat expires transport Dahmani","Transport",_d(2024,7,1),_d(2025,6,30),11200000,"EXPIRE"),
        ]:
            c = Contrat(id=_u(),reference=ref,partenaire_id=clients[ci].id,objet=obj,type_contrat=tc,
                date_debut=dd,date_fin=dm,montant=mt,devise="DZD",
                mode_facturation=random.choice(["Mensuel","Trimestriel","Annuel"]),
                conditions_paiement=random.choice(["Virement 30 jours","Virement 45 jours","Cheque 60 jours"]),
                statut=StatutContrat.ACTIF if st=="ACTIF" else StatutContrat.EXPIRE)
            db.add(c); contrats.append(c)
        db.flush()

        # ── AVENANTS ──────────────────────────────────────────────
        for ct in [contrats[0],contrats[2],contrats[4],contrats[7]]:
            for j in range(random.randint(1,3)):
                db.add(Avenant(id=_u(),contrat_id=ct.id,numero=f"Avenant N\u00b0{j+1:02d}",
                    date=ct.date_debut+timedelta(days=random.randint(30,120)),
                    objet=random.choice(["Extension duree","Modification montant","Ajout de lignes"]),
                    description="Modification des conditions contractuelles",
                    modif_montant=random.choice([None,round(random.uniform(500000,3000000),2)])))
        db.flush()

        # ── CAUTIONS ──────────────────────────────────────────────
        cautions = []
        for num,tp,ci,cti,mt,obj,bq,st in [
            ("CAU-2026-001","SOUMISSION",0,0,925000,"AO-05/2026 - Transport personnel","BNA Agence Arzew","CREATION"),
            ("CAU-2026-002","SOUMISSION",2,2,1200000,"Appel d'offres N\u00b034/2025","CPA Oran","CHEZ_CLIENT"),
            ("CAU-2026-003","SOUMISSION",4,4,270000,"AO Messagerie inter-villes","BDL Oran","RETOURNEE"),
            ("CAU-2025-004","SOUMISSION",0,0,1850000,"AO-12/2025 - Transport general","BNA Direction Centrale","MAIN_LEVEE"),
            ("CAU-2026-005","BONNE_EXECUTION",1,1,480000,"Bon de commande NAV-2026-018","BNA Direction Centrale","CREATION"),
            ("CAU-2026-006","BONNE_EXECUTION",0,0,925000,"CTR-2026-001 Transport personnel","BNA Agence Arzew","CHEZ_CLIENT"),
            ("CAU-2025-007","BONNE_EXECUTION",3,3,360000,"Contrat chantier BTP","BNA Blida","RETOURNEE"),
            ("CAU-2024-008","BONNE_EXECUTION",5,5,1800000,"Contrat cadre voyageurs","BNA Direction Centrale","MAIN_LEVEE"),
            ("CAU-2026-009","DEMANDE",3,3,360000,"Demande caution chantier BTP","BNA Blida","CREATION"),
            ("CAU-2026-010","DEMANDE",5,5,1800000,"Demande caution voyageurs","BNA Direction Centrale","CHEZ_CLIENT"),
            ("CAU-2026-011","DEMANDE",7,7,600000,"Demande caution transport materiel","BDL Tipaza","RETOURNEE"),
            ("CAU-2025-012","DEMANDE",0,0,925000,"Demande caution generale","BNA Agence Arzew","MAIN_LEVEE"),
            ("CAU-2026-013","SOUMISSION",6,6,180000,"AO Shuttle Hotel","BDL Alger","CREATION"),
            ("CAU-2026-014","BONNE_EXECUTION",8,8,420000,"Contrat equipements industriels","CPA Constantine","CHEZ_CLIENT"),
            ("CAU-2026-015","DEMANDE",9,9,210000,"Demande syndicat transport","BNA Alger Centre","CREATION"),
        ]:
            ct=contrats[cti]
            c = Caution(id=_u(),numero=num,type=TypeCaution[tp],client_id=clients[ci].id,
                contrat_id=ct.id,montant=mt,devise="DZD",reference_type="Contrat",
                reference_numero=ct.reference,objet=obj,
                date_emission=ct.date_debut+timedelta(days=random.randint(0,30)),
                date_echeance=ct.date_fin,statut=StatutCaution[st],banque_emetteur=bq,
                lieu_demande=random.choice(["Arzew","Alger","Oran","Constantine"]),
                lieu_soumission=random.choice(["Alger","Oran","Constantine","Annaba"]),
                numero_compte_bancaire=f"001 00954 0300 {random.randint(100000,999999)}",
                societe_nom="ENGTP - Direction Regionale Arzew")
            db.add(c); cautions.append(c)
        db.flush()

        # ── PIECES ────────────────────────────────────────────────
        pieces = []
        for ref,des,cat,mar,mod,stock,mn in [
            ("FLT-001","Filtre a huile Mercedes Sprinter","Filtres","Bosch","Sprinter 2.2 CDI",15,5),
            ("FLT-002","Filtre a air Renault Master","Filtres","Mann-Filter","Master 2.3 dCi",22,8),
            ("FLT-003","Filtre a gasoil Iveco Daily","Filtres","Fleetguard","Daily 3.0",10,5),
            ("FLT-004","Filtre habitacle Toyota Coaster","Filtres","Denso","Coaster",8,4),
            ("FRN-001","Plaquettes de frein avant","Freinage","TRW","Mercedes Sprinter",8,4),
            ("FRN-002","Disques de frein avant","Freinage","Brembo","Iveco Daily",6,3),
            ("FRN-003","Liquide de frein DOT4","Freinage","Castrol","Universel",30,10),
            ("FRN-004","Etrier de frein avant","Freinage","TRW","Renault Master",3,2),
            ("PNE-001","Pneu 225/75 R16C","Pneumatique","Michelin","Minibus",12,6),
            ("PNE-002","Pneu 235/75 R17.5","Pneumatique","Continental","Bus",8,4),
            ("PNE-003","Pneu 195/75 R16C","Pneumatique","Goodyear","Van",15,6),
            ("HUI-001","Huile moteur 10W40 5L","Lubrifiant","Total Quartz","Diesel",50,15),
            ("HUI-002","Huile boite 75W90 1L","Lubrifiant","Motul","Manuel",20,8),
            ("HUI-003","Huile hydraulique 5L","Lubrifiant","Shell","Direction assistee",12,5),
            ("BTR-001","Batterie 12V 110Ah","Electrique","Varta","Heavy Duty",6,3),
            ("AMB-001","Ampoule H7 12V 55W","Eclairage","Philips","Universel",40,15),
            ("AMB-002","Ampoule LED FOG","Eclairage","Osram","Bus",20,8),
            ("POL-001","Courroie trapezoidale","Moteur","Gates","Iveco Daily",10,5),
            ("POL-002","Courroie distribution","Moteur","SKF","Mercedes Sprinter",4,2),
            ("REF-001","Reservoir eau liquide refroidissement","Refroidissement","Febi","Renault Master",5,2),
            ("SEN-001","Capteur de vitesse","Electrique","Bosch","Mercedes Sprinter",4,2),
            ("SEN-002","Capteur PMS","Electrique","Bosch","Iveco Daily",3,2),
            ("COR-001","Joint de culasse","Moteur","Victor Reinz","Renault Master",2,1),
            ("COR-002","Turbo complet","Moteur","Garrett","Iveco Daily",1,1),
        ]:
            p = Piece(id=_u(),reference=ref,designation=des,categorie=cat,marque=mar,
                modele_compatibilite=mod,stock_actuel=stock,stock_minimum=mn,
                emplacement=f"{chr(65+random.randint(0,3))}-{random.randint(1,10):02d}-{random.randint(1,5):02d}")
            db.add(p); pieces.append(p)
        db.flush()

        # ── INTERVENTIONS ─────────────────────────────────────────
        interventions = []
        for num,vi,cat,tp,dt,km,ct,st,pdt,trav in [
            ("INT-2026-00001",0,"VIDANGE","PREVENTIVE",_d(2026,1,15),145000,35000,"TERMINEE",None,"Vidange complete + filtres"),
            ("INT-2026-00002",2,"Revision generale","PREVENTIVE",_d(2026,2,10),87000,45000,"TERMINEE",None,"Revision complete 80 000 km"),
            ("INT-2026-00003",7,"VIDANGE","PREVENTIVE",_d(2026,2,28),112000,30000,"TERMINEE",None,"Vidange + vidange boite VTC"),
            ("INT-2026-00004",11,"VIDANGE","PREVENTIVE",_d(2026,3,10),8000,12000,"TERMINEE",None,"Premiere vidange 5 000 km"),
            ("INT-2026-00005",0,"VIDANGE","PREVENTIVE",_d(2026,5,1),155000,38000,"PLANIFIEE",_d(2026,5,1),"Prochaine vidange prevue"),
            ("INT-2026-00006",3,"Revision generale","PREVENTIVE",_d(2026,6,15),240000,50000,"PLANIFIEE",_d(2026,6,15),"Revision 240 000 km"),
            ("INT-2026-00007",4,"Freinage","CORRECTIVE",_d(2026,3,5),235000,22000,"TERMINEE",None,"Remplacement plaquettes + disques"),
            ("INT-2026-00008",5,"Pneumatique","CORRECTIVE",_d(2026,3,25),310000,12000,"TERMINEE",None,"Remplacement pneu avant gauche"),
            ("INT-2026-00009",8,"Electrique","CORRECTIVE",_d(2026,4,1),112000,8000,"TERMINEE",None,"Remplacement batterie + diagnostic"),
            ("INT-2026-00010",3,"Moteur","CORRECTIVE",_d(2026,4,10),235000,15000,"EN_COURS",None,"Surchauffe moteur - diagnostic"),
            ("INT-2026-00011",0,"Carrosserie","CORRECTIVE",_d(2026,4,15),148000,5000,"EN_COURS",None,"Reparation bossoir + peinture"),
            ("INT-2026-00012",1,"Carrosserie","CORRECTIVE",_d(2026,4,20),198000,5000,"PLANIFIEE",_d(2026,4,20),"Reparation porte arriere"),
            ("INT-2026-00013",6,"Moteur","CORRECTIVE",_d(2026,4,25),95000,8000,"PLANIFIEE",_d(2026,4,25),"Remplacement turbo"),
            ("INT-2026-00014",2,"Freinage","CORRECTIVE",_d(2026,3,15),90000,3000,"ANNULEE",None,"Annule - mauvaise date"),
            ("INT-2026-00015",9,"Revision generale","PREVENTIVE",_d(2026,3,20),275000,60000,"TERMINEE",None,"Revision externe garage PartenAIR"),
            ("INT-2026-00016",10,"Pneumatique","CORRECTIVE",_d(2026,4,5),95000,10000,"TERMINEE",None,"Equilibrage + parallelisme externe"),
        ]:
            iv = Intervention(id=_u(),numero=num,vehicule_id=vehicules[vi].id,
                mecanicien_responsable_id=random.choice(mecaniciens[:3]).id,
                type=CategorieIntervention[tp],categorie=cat,date=dt,kilometrage=km,
                travail_effectue=trav,est_externe=(num in ["INT-2026-00015","INT-2026-00016"]),
                prestataire_nom="PartenAIR Garage" if num=="INT-2026-00015" else None,
                prestataire_telephone="021456789" if num=="INT-2026-00015" else None,
                cout_total=ct,prochaine_date_maintenance=pdt,statut=StatutIntervention[st])
            db.add(iv); interventions.append(iv)
        db.flush()

        # ── MOUVEMENTS STOCK ──────────────────────────────────────
        for iv in interventions[:8]:
            for p in random.sample(pieces, random.randint(1,2)):
                db.add(MouvementStock(id=_u(),piece_id=p.id,type=TypeMouvement.SORTIE,
                    quantite=random.randint(1,3),date=iv.date,motif=f"Intervention {iv.numero}",
                    intervention_id=iv.id,fournisseur_id=random.choice(fournisseurs[:4]).id))
        for _ in range(8):
            db.add(MouvementStock(id=_u(),piece_id=random.choice(pieces).id,type=TypeMouvement.ENTREE,
                quantite=random.randint(5,30),date=_dp(random.randint(1,90)),
                motif="Reapprovisionnement fournisseur",fournisseur_id=random.choice(fournisseurs[:4]).id))
        for _ in range(2):
            db.add(MouvementStock(id=_u(),piece_id=random.choice(pieces).id,type=TypeMouvement.INVENTAIRE,
                quantite=0,date=_dp(random.randint(1,30)),motif="Inventaire periodique",
                ecart_inventaire=random.choice([-2,-1,0,0,1])))
        db.flush()

        # ── FACTURES ──────────────────────────────────────────────
        mois_options = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
        modes = list(ModePaiement)
        factures_list = []
        for ci, st, mode in [
            (0, "PAYEE", "VIREMENT"),
            (1, "EN_ATTENTE", "CHEQUE"),
            (2, "PAYEE", "ESPECE"),
            (3, "EN_ATTENTE", "VIREMENT"),
            (4, "EN_RETARD", "VIREMENT"),
            (0, "PAYEE", "CARTE"),
            (5, "ANNULEE", "ESPECE"),
            (6, "EN_ATTENTE", "CHEQUE"),
            (7, "PAYEE", "VIREMENT"),
            (0, "EN_ATTENTE", "ESPECE"),
            (8, "EN_RETARD", "VIREMENT"),
            (9, "PAYEE", "CARTE"),
        ]:
            montant = round(random.uniform(200000, 2500000), 2)
            fc = Facture(
                id=_u(),
                numero=f"INV-2026-{len(factures_list)+1:03d}",
                client_id=clients[ci].id,
                date_facture=_dp(random.randint(10, 90)),
                mois_realisation=random.choice(mois_options),
                montant_facture=montant,
                statut=StatutFacture[st],
                mode_reglement=ModePaiement[mode] if st == "PAYEE" else None,
                date_reglement=_dp(random.randint(1, 10)) if st == "PAYEE" else None,
                remarques=random.choice([None, "Facture en attente de régularisation", "Paiement reçu - clôturé", None]),
            )
            db.add(fc)
            factures_list.append(fc)
        db.flush()

        # ── DEPENSES VEHICULES ────────────────────────────────────
        for v in vehicules:
            for cat_dep in CategorieDepenseVehicule:
                db.add(DepenseVehicule(id=_u(),vehicule_id=v.id,categorie=cat_dep,
                    date=_dp(random.randint(5,180)),montant=round(random.uniform(2000,120000),2),
                    kilometrage=v.kilometrage_actuel-random.randint(100,10000),
                    fournisseur=random.choice(["TOTAL ALGERIE","OPTIMUS PIECES AUTO",None]),
                    notes=f"Depense {cat_dep.value.lower()} - {v.marque} {v.modele}"))
        db.flush()

        # ── CONSTATS ──────────────────────────────────────────────
        for vi,tiers,lieu,cir,dom,info in [
            (1,True,"Autoroute Est-Ouest","Changement de voie non signale","Bossoir avant droit endommage","Toyota Corolla grise 12345_B_16"),
            (5,True,"Rocade Alger","Arret brusque - collision","Arriere carrosserie deformee","VW Golf noire 99887_C_05"),
            (0,False,"RN1 Blida","Eclatement pneu - perte control","Reparation carrosserie",None),
            (3,False,"Centre-ville Constantine","Deversage de chargement","Plancher charge endommage",None),
            (4,True,"Piste Ouest - Oran","Depassement non reglementaire","Retroviseur casse","Peugeot 208 blanche 55667_D_09"),
        ]:
            db.add(Constat(id=_u(),vehicule_id=vehicules[vi].id,
                chauffeur_id=random.choice(chauffeurs[:5]).id,date=_dp(random.randint(5,90)),
                heure=f"{random.randint(7,18):02d}:{random.randint(0,59):02d}",
                lieu=lieu,circonstances=cir,dommages=dom,tiers_implique=tiers,infos_tiers=info))
        db.flush()

        # ── DOCUMENTS ─────────────────────────────────────────────
        for v in vehicules[:5]:
            db.add(Document(id=_u(),nom=f"Carte grise {v.immatriculation}",document_type="Carte Grise",
                url_fichier="/assets/documents/sample.pdf",mime_type="application/pdf",
                entity_type="vehicule",entity_id=v.id,date_emission=_d(2022,1,1),date_expiration=_d(2027,1,1)))
        for ch in chauffeurs[:4]:
            db.add(Document(id=_u(),nom=f"Permis {ch.prenom} {ch.nom}",document_type="Permis",
                url_fichier="/assets/documents/sample.pdf",mime_type="application/pdf",
                entity_type="employe",entity_id=ch.id,date_emission=_d(2020,6,1),date_expiration=_d(2030,6,1)))
        for ct in contrats[:5]:
            db.add(Document(id=_u(),nom=f"Contrat {ct.reference}",document_type="Contrat",
                url_fichier="/assets/documents/sample.pdf",mime_type="application/pdf",
                entity_type="contrat",entity_id=ct.id))
        for cl in clients[:6]:
            db.add(Document(id=_u(),nom=f"RC {cl.nom_commercial}",document_type="Registre de commerce",
                url_fichier="/assets/documents/sample.pdf",mime_type="application/pdf",
                entity_type="partenaire",entity_id=cl.id))
        for ca in cautions[:4]:
            db.add(Document(id=_u(),nom=f"Caution {ca.numero}",document_type="Caution Bancaire",
                url_fichier="/assets/documents/sample.pdf",mime_type="application/pdf",
                entity_type="caution",entity_id=ca.id))
        for iv in interventions[:3]:
            db.add(Document(id=_u(),nom=f"Rapport {iv.numero}",document_type="Rapport d'intervention",
                url_fichier="/assets/documents/sample.pdf",mime_type="application/pdf",
                entity_type="intervention",entity_id=iv.id))
        db.flush()

        # ── RECEPTIONS ──────────────────────────────────────────
        modes = list(ModeReglementReception)
        for idx in range(5):
            f = random.choice(fournisseurs[:5])
            qty1 = random.randint(5, 30)
            qty2 = random.randint(3, 15)
            pu1 = round(random.uniform(15000, 120000), 2)
            pu2 = round(random.uniform(15000, 120000), 2)
            p1, p2 = random.sample(pieces, 2)
            montant = round(qty1 * pu1 + qty2 * pu2, 2)
            rec = Reception(
                id=_u(),
                numero=f"REC-2026-{idx+1:04d}",
                fournisseur_id=f.id,
                date=_dp(random.randint(5, 60)),
                lieu=f"Entrepôt {f.nom_commercial or 'Principal'}",
                montant_total=montant,
                mode_reglement=random.choice(modes).name,
                motif=random.choice([
                    "Réapprovisionnement trimestriel",
                    "Commande spéciale pièces détachées",
                    "Remplacement stocks usure",
                    "Commande urgente",
                    None,
                ]),
                reference_document=f"BC-{random.randint(1000,9999)}",
                url_pdf=None,
            )
            db.add(rec)
            db.add(ReceptionLigne(id=_u(), reception_id=rec.id, piece_id=p1.id,
                quantite=qty1, prix_unitaire=pu1, montant_ligne=round(qty1 * pu1, 2)))
            db.add(ReceptionLigne(id=_u(), reception_id=rec.id, piece_id=p2.id,
                quantite=qty2, prix_unitaire=pu2, montant_ligne=round(qty2 * pu2, 2)))
        db.flush()

        db.commit()
        print("[seed] Demo data inserted successfully.")


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "sqlite:///./etransport.db"
    seed_database(url)
