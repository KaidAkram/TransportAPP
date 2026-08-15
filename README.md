# 🚌 E-Transport ERP — Système Intégré de Gestion de Flotte & Exploitation

> **ERP d'Entreprise de Transport de Voyageurs & Logistique — République Algérienne**  
> Architecture Moderne : **FastAPI (Python 3.13)** + **Next.js 16 (React 19 / Turbopack)** + **SQLite / PostgreSQL (SQLAlchemy 2.0 / Alembic)**

---

## 🌟 Vue d'Ensemble des Fonctionnalités

E-Transport ERP est une plateforme complète et moderne conçue pour piloter l'ensemble des opérations d'une entreprise de transport :

1. **Parc Automobile & Flotte** : Gestion des autocars, minibus et véhicules, fiches techniques, suivi kilométrique, contrôle technique et constats d'accidents.
2. **Personnel & Ressources Humaines** : Dossiers des Chauffeurs (permis B, C1, D, ED et dates de validité) et Mécaniciens qualifiés par spécialité d'atelier.
3. **CRM & Partenaires Commerciaux** : Portefeuille Clients (Air Algérie, Sonatrach, Cosider...) et Fournisseurs de pièces détachées avec identifiants fiscaux algériens (NIF, NIS, RC).
4. **Contrats & Avenants** : Conventions de transport pluriannuelles, gestion des réévaluations tarifaires et avenants.
5. **Cautions Bancaires** : Cautions de Soumission et de Bonne Exécution (BNA, CPA, BEA, BDL) avec génération de récépissés PDF.
6. **Stock & Pièces de Rechange** : Gestion du magasin, alertes seuil minimum, réceptions et inventaires.
7. **Maintenance & Ordres de Travail (OT)** : Interventions préventives et correctives avec déstockage atomique et traçabilité des pièces consommées.
8. **Planification & Trajets Inter-Wilayas** : Planning des missions, équipage double chauffeur, prise en charge hébergement/restauration.
9. **Finances, Facturation & Règlements** : Devis commerciaux avec TVA 19%, conversion en contrats, facturation et suivi des encaissements bancaires.
10. **Business Intelligence & TCO** : Tableaux de bord stratégiques, coût de revient kilométrique, rentabilité par autocar et exports Excel (.xlsx).
11. **Sécurité, Authentification & Feature Toggles** : Authentification JWT à deux rôles (**Admin**, **Gestionnaire**) et panneau d'administration pour activer/désactiver dynamiquement 30+ actions à la volée.

---

## 🔐 Authentification & Rôles

| Identifiant | Mot de passe | Rôle | Privilèges |
| :--- | :--- | :--- | :--- |
| **`admin`** | `123` | `admin` | Accès complet sans restriction + Panneau `/admin/features` |
| **`gestionnaire`** | `123` | `gestionnaire` | Accès opérationnel gouverné par les Feature Toggles |

---

## 🚀 Démarrage Rapide

### Prérequis
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 1. Initialisation du Backend (FastAPI)

```bash
# Se positionner dans le dossier backend
cd backend

# Activer l'environnement virtuel (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Initialiser et peupler la base de données avec le jeu de données réaliste
python seed.py

# Lancer le serveur backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Documentation Swagger / OpenAPI :** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Endpoint Santé :** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 2. Démarrage du Frontend (Next.js)

```bash
# Dans un nouveau terminal, se positionner dans le dossier frontend
cd frontend

# Installer les dépendances (si nécessaire)
npm install

# Démarrer le serveur de développement
npm run dev
```

- **Application Web :** [http://localhost:3000](http://localhost:3000)
- **Page de Connexion :** [http://localhost:3000/login](http://localhost:3000/login)

---

## 🧪 Exécution des Tests Automatisés

Le projet comprend une suite complète de 21 tests d'intégration :

```bash
# Exécution de la suite Pytest
cd backend
python -m pytest tests/ -v
```

```bash
# Vérification du build de production Frontend
cd frontend
npm run build
```

Consultez [TEST_REPORT.md](file:///c:/Users/Akram%20KAID/Desktop/Entreprise_transport/TEST_REPORT.md) pour les détails complets des tests.
