# 📑 RAPPORT D'ÉTAT COMPLET DU SYSTÈME — ERP E-TRANSPORT
**Date d'édition :** 13 Août 2026  
**Version :** 1.0.0-PROD-READY  
**Statut Global :** ✅ Opérationnel — 7 Modules Métier + Dashboard & Système d'Alertes Actifs  
**Dépôt :** `Entreprise_transport` (Monorepo Découplé Frontend + Backend)

---

## Executive Summary

Le système **E-Transport ERP** est une plateforme intégrée de gestion d'entreprise de transport de voyageurs et de logistique, conçue pour répondre aux exigences réglementaires, techniques, commerciales et financières du secteur (adaptée aux normes algériennes : fiscalité NIF/NIS/RC, garanties bancaires BNA/CPA/BDL, gestion de flotte grand tourisme et maintenance assistée par ordinateur GMAO).

Le système a été développé selon une architecture monorepo moderne, découplée et hautement résiliente :
- **Frontend :** Next.js 16 (App Router, Turbopack, Tailwind CSS v4, Shadcn UI, Zustand).
- **Backend :** FastAPI (Python 3.13, SQLAlchemy 2.0 ORM, Pydantic v2, ReportLab PDF Engine).
- **Base de Données :** Architecture hybride SQLite / PostgreSQL (Supabase) avec Single Table Inheritance (STI) et transactions ACID strictes.

---

## 🏛️ 1. Architecture Globale du Projet

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     FRONTEND (Next.js 16)                                   │
│  • App Router (11 Routes Statiques & Dynamiques)                                            │
│  • Design System Haute Fidélité (#1E40AF, Glassmorphism, Inter Font, Responsive Grid)        │
│  • Composants Shadcn UI + Radix UI + Lucide Icons                                           │
│  • Modales Interactives & Formulaires avec Validation Zod + React Hook Form                 │
│  • Notification Bell avec Polling temps réel des alertes système                            │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │ HTTP / JSON REST API (Port 8000)
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      BACKEND (FastAPI)                                      │
│  • 10 Routeurs Dédiés (/vehicules, /employes, /partenaires, /contrats, /cautions, ...)       │
│  • Moteur de Génération PDF Officiel ReportLab (Actes de Cautions Bancaires A4)             │
│  • Déductions de Stock Transactionnelles ACID lors des Interventions d'Atelier              │
│  • Système d'Alertes Centralisé (Expirations Documents, Ruptures de Stock, Cautions)        │
│  • Middleware CORS & Gestionnaire de Cycle de Vie (Lifespan Auto Table Sync)                │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │ SQLAlchemy 2.0 Async/Sync Dialect
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                BASE DE DONNÉES RELATIONNELLE                                │
│  • 15+ Tables ORM avec Single Table Inheritance (Employe: Chauffeur/Mecanicien)             │
│  • Relations 1:N et N:M avec Clés Étrangères (RESTRICT / CASCADE / SET NULL)                │
│  • Traçabilité Immuable des Mouvements de Stock (ENTREE, SORTIE, INVENTAIRE)                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 2. Design System & Expérience Utilisateur (UI/UX)

L'interface a été conçue selon des standards visuels exécutifs de premier ordre, bannissant tout élément générique ou enfantin au profit d'une ergonomie corporate haut de gamme :

### 2.1 Palette de Couleurs & Tokens Sémantiques
- **Primary Corporate :** `#1E40AF` (Bleu Royal Institutionnel).
- **Primary Light :** `#DBEAFE` (Bleu ciel doux pour les badges et sélections actives).
- **Surface / Cartes :** `#FFFFFF` / Fond ardoise `#F8FAFC`.
- **En-têtes de Tableaux :** `#F9FAFB` avec bordures subtiles `1px solid #E5E7EB`.
- **Indicateurs Sémantiques de Statut :**
  - 🟢 **Succès / Valide / Disponible / Terminé :** Vert émeraude (`bg-emerald-50`, `text-emerald-700`).
  - 🟠 **Attention / Échéance Proche / En Mission / Faible :** Ambre (`bg-amber-50`, `text-amber-700`).
  - 🔴 **Danger / Expiré / Rupture / Immobilisé :** Rouge carmin (`bg-rose-50`, `text-rose-700`).
  - ⚪ **Neutre / Archivé / Hors Service :** Ardoise (`bg-slate-100`, `text-slate-600`).

### 2.2 Typographie & Données Denses
- **Police Principale :** `Inter` (Google Fonts) avec prise en charge native des chiffres tabulaires pour aligner parfaitement les montants financiers en Dinars Algériens (DZD) et les kilométrages.
- **Police Monospace :** `JetBrains Mono` pour les immatriculations (`16-123456-00`), références de pièces (`FIL-001`), ordres de travail (`INT-2026-001`) et numéros de cautions (`CAU-2026-001`).

### 2.3 Assets Visuels Exécutifs
- **Avatars Professionnels Haute Résolution :**
  - Chauffeurs : Portraits corporate en tenue officielle (`/assets/avatars/driver_pro.jpg`).
  - Mécaniciens : Chefs d'atelier et techniciens qualifiés (`/assets/avatars/mechanic_pro.jpg`).
- **Logos Partenaires :** Logos d'entreprises institutionnelles (`/assets/partners/client_logo.jpg` - Air Algérie Tours, `/assets/partners/supplier_logo.jpg` - Maghreb Pièces).

---

## ⚙️ 3. Détail des Modules Métier & Fonctionnalités Opérationnelles

### 📊 Module 0 : Centre de Commandement & Tableau de Bord (`/`)
* **KPIs Exécutifs Temps Réel :** Supervision consolidée des 6 axes opérationnels avec décompte instantané.
* **Barre d'Actions Rapides :** Boutons d'accès direct avec modales intégrées (`+ Véhicule`, `+ Ordre de Travail`, `+ Entrée Stock`, `+ Caution`, `+ Contrat`).
* **Centre des Alertes & Échéances Réglementaires :** Affichage hiérarchisé des alertes critiques avec redirection vers la fiche entité exacte.
* **Journal d'Activité Récente :** Fil d'actualité chronologique des derniers ordres de travail, réceptions de livraison et signatures de marchés.
* **Notification Bell (TopBar) :** Cloche interactive avec badge animé indiquant le nombre d'alertes actives et panneau déroulant catégorisé.

---

### 🚌 Module 1 : Gestion du Parc Automobile (`/vehicules` & `/vehicules/[id]`)
* **Catalogue de la Flotte :** Liste filtrable par marque, modèle, type (Bus, Minibus, Van, Voiture) et statut opérationnel (`DISPONIBLE`, `EN_MISSION`, `MAINTENANCE`, `IMMOBILISE`, `HORS_SERVICE`).
* **Fiche Véhicule à 4 Onglets :**
  1. **Fiche Technique :** Immatriculation, marque, modèle, année, capacité assise, date de 1ère mise en circulation, kilométrage et TCO cumulé.
  2. **Documents Administratifs :** Gestion de la Carte Grise, Assurance et Contrôle Technique avec calcul dynamique du statut de validité (`Valide`, `Expire bientôt &le; 30j`, `Expiré`) et téléchargement direct.
  3. **Constats & Sinistres :** Déclaration d'accidents matériels, relevé des dommages, identification des tiers impliqués et historique des sinistres.
  4. **Maintenance & Pièces Consommées :** Journal complet des ordres de travail effectués sur le véhicule avec liste des pièces détachées prélevées et coûts associés.

---

### 👨‍✈️ Module 2 : Gestion du Personnel & RH (`/employes` & `/employes/[id]`)
* **Single Table Inheritance (STI) :** Gestion unifiée dans la table `employes` distinguant :
  - **Chauffeurs :** Numéro de permis biométrique, catégories validées (`B, C1, D, ED`), suivi de la date d'expiration, statut de couverture d'assurance professionnelle, et scan PDF.
  - **Mécaniciens :** Spécialité technique (Moteur, Électricité, Diagnostic), niveau d'expérience, rôle de Chef d'Atelier, et historique des interventions supervisées.
* **Dossiers RH & Documents Universels :** Rattachement de la CNI, extrait de naissance, contrat de travail et carte Chifa.

---

### 🏢 Module 3 : Gestion des Partenaires CRM (`/partenaires` & `/partenaires/[id]`)
* **Single Table Inheritance (STI) :** Gestion centralisée évitant toute double saisie pour :
  - **Clients (Donneurs d'Ordres) :** Agences de voyages, organismes publics, complexes hôteliers, avec chiffre d'affaires et délais de paiement accordés.
  - **Fournisseurs (Pièces & Services) :** Magasins de pièces de rechange, concessionnaires, avec spécialité et conditions de livraison.
* **Fiscalité Algérienne Complète :** NIF (15 chiffres), NIS (18 chiffres), Registre de Commerce (RC), et Article d'imposition.
* **Multi-Contacts & Timeline d'Interactions :** Carnet d'adresses multi-interlocuteurs par partenaire et journal de bord CRM (Appels, Réunions, Emails, Notes).

---

### 📑 Module 4 : Marchés, Contrats & Avenants (`/contrats` & `/contrats/[id]`)
* **Gestion des Conventions :** Référence unique, partie prenante cliente, date de début/fin, montant global en DZD, mode de facturation et conditions de règlement.
* **Alertes Visuelles d'Échéance :**
  - 🔴 **Urgent :** Expire dans &le; 7 jours.
  - 🟠 **Bientôt :** Expire dans &le; 30 jours.
  - 🟢 **Valide :** Contrat en cours de validité.
* **Gestion des Avenants :** Enregistrement d'avenants contractuels avec calcul automatique de l'impact financier (+/- DZD) et prolongation de date de fin.
* **Dossier Contractuel Dédié :** Fiche complète avec sous-tableaux des avenants, cautions bancaires rattachées et pièces jointes signées.

---

### 🛡️ Module 5 : Cautions Bancaires & Moteur PDF (`/cautions`)
* **Typologie des Cautions :** Cautions de Soumission (Appels d'offres) et Cautions de Bonne Exécution (Marchés signés).
* **Cycle de Vie Financier :** Suivi d'état (`CREATION`, `CHEZ_CLIENT`, `RETOURNEE`, `MAIN_LEVEE`).
* **Génération Automatique de PDF Officiels (ReportLab) :**
  - Endpoint : `POST /api/v1/cautions/{id}/generate-pdf`
  - Production instantanée d'un acte officiel de cautionnement bancaire au format A4 aux normes bancaires algériennes (Banque Nationale d'Algérie - BNA), avec clauses juridiques d'engagement à première demande, montants en chiffres et lettres, et blocs de signature légalisée.
  - Sauvegarde automatique sur disque et téléchargement direct via le bouton "PDF Acte" de l'interface.

---

### 📦 Module 6 : Gestion du Stock & Magasin (`/stock`)
* **Catalogue de Pièces Détachées :** Filtres par catégories (Filtres, Freinage, Moteur, Pneumatiques, Électricité, Lubrifiants).
* **Gestion des Emplacements Physiques :** Traçabilité précise dans le magasin (ex: `Rayon A - Étagère 03 - Casier 02` $\rightarrow$ `A-03-02`).
* **Réception de Commandes Fournisseurs :** Modale `AddStockEntryModal` pour enregistrer les bons de livraison (BL) et incrémenter le stock.
* **Inventaire Physique & Régularisation :** Modale `InventoryAuditModal` permettant de saisir le comptage réel, calculer l'écart automatique et justifier les écarts (Casse, Perte, Erreur de saisie).
* **Grand Livre des Mouvements Immuables :** Traçabilité indélébile de toutes les entrées, sorties et ajustements d'inventaire.

---

### 🔧 Module 7 : Maintenance Flotte & GMAO (`/maintenance`)
* **Ordres de Travail (OT) :** Création d'interventions préventives et correctives avec kilométrage, diagnostic, chef d'équipe assigné et prestataires externes éventuels.
* **⚡ Interconnexion ACID Magasin $\leftrightarrow$ Atelier (Cœur ERP) :**
  - Sélection dynamique de pièces détachées avec affichage des stocks disponibles en temps réel.
  - **Contrôle préalable strict :** Si la quantité demandée excède le stock disponible, la transaction est rejetée avec un message explicite (`Stock insuffisant...`).
  - **Déduction atomique :** Lors de la validation, le stock est automatiquement décrémenté, des mouvements immuables de type `SORTIE` sont créés avec référence `OT-XXX`, et une alerte de réapprovisionnement est déclenchée si `stock_actuel <= stock_minimum`.
  - **Mise à jour du véhicule :** Le statut du véhicule passe automatiquement à `MAINTENANCE` (si en cours) ou `DISPONIBLE` (si terminé), et les dépenses sont imputées au TCO du véhicule.

---

## 🛠️ 4. Synthèse Technique Backend & Base de Données

### 4.1 Structure des Modèles ORM (SQLAlchemy 2.0)
| Modèle | Table | Caractéristiques Notables |
|---|---|---|
| `Vehicule` | `vehicules` | Immatriculation unique, TCO cumulé, statut opérationnel. |
| `Constat` | `constats` | Déclarations de sinistres et informations tiers. |
| `Employe` | `employes` | Base STI (`polymorphic_on="type_employe"`). |
| `Chauffeur` | `employes` | STI Chauffeur avec permis et assurance. |
| `Mecanicien` | `employes` | STI Mécanicien avec spécialité et chef d'atelier. |
| `Permis` | `permis` | Titre de conduite avec catégories multiples (`B, C1, D, ED`). |
| `Partenaire` | `partenaires` | Base STI (`polymorphic_on="role_partenaire"`). |
| `Client` | `partenaires` | STI Client avec type et chiffre d'affaires. |
| `Fournisseur` | `partenaires` | STI Fournisseur avec spécialité pièces. |
| `Contact` | `contacts` | Multi-contacts par partenaire. |
| `CRMNote` | `crm_notes` | Historique des rendez-vous et échanges. |
| `Contrat` | `contrats` | Marchés de transport avec calcul d'échéances. |
| `Avenant` | `avenants` | Modifications contractuelles avec delta financier. |
| `Caution` | `cautions` | Garanties bancaires BNA avec lien PDF. |
| `Piece` | `pieces` | Pièces détachées, seuil d'alerte, emplacement. |
| `MouvementStock` | `mouvements_stock` | Ledger immuable des flux physiques. |
| `Intervention` | `interventions` | Ordres de travail avec coût et dates prévisionnelles. |
| `Document` | `documents` | Gestion documentaire universelle polymorphe. |

---

## 🧪 5. Bilan des Tests Automatisés & Assurance Qualité

### 5.1 Suite Pytest Backend (`16 / 16 Tests Réussis — 100%`)
```
backend/tests/test_auth.py::test_auth_me_unauthenticated_returns_401        PASSED [  6%]
backend/tests/test_auth.py::test_auth_me_invalid_token_returns_401          PASSED [ 12%]
backend/tests/test_auth.py::test_auth_me_valid_token_returns_200            PASSED [ 18%]
backend/tests/test_auth.py::test_admin_role_authorization_guard             PASSED [ 25%]
backend/tests/test_contrats_cautions_api.py::test_contrats_and_cautions     PASSED [ 31%]
backend/tests/test_dashboard_alerts_api.py::test_dashboard_and_alerts       PASSED [ 37%]
backend/tests/test_db_connectivity.py::test_database_ping                   PASSED [ 43%]
backend/tests/test_employes_api.py::test_employe_polymorphic_crud           PASSED [ 50%]
backend/tests/test_health.py::test_root_endpoint                            PASSED [ 56%]
backend/tests/test_health.py::test_health_root_endpoint                     PASSED [ 62%]
backend/tests/test_health.py::test_health_api_v1_endpoint                   PASSED [ 68%]
backend/tests/test_models.py::test_models_metadata_integrity                PASSED [ 75%]
backend/tests/test_partenaires_api.py::test_partenaire_crm_lifecycle       PASSED [ 81%]
backend/tests/test_seed.py::test_seed_execution_and_avatar_assets           PASSED [ 87%]
backend/tests/test_stock_maintenance_api.py::test_stock_maintenance_sync    PASSED [ 93%]
backend/tests/test_vehicules_api.py::test_vehicle_crud_lifecycle            PASSED [100%]

======================== 16 passed in 6.44s ========================
```

### 5.2 Compilation Production Next.js 16 (`11 / 11 Routes Compilées Sans Erreur`)
```
Route (app)
┌ ○ /                           (Centre de Commandement Dashboard)
├ ○ /_not-found                 (Gestion 404)
├ ○ /cautions                   (Cautions Bancaires & Actes PDF)
├ ○ /contrats                   (Marchés & Conventions)
├ ƒ /contrats/[id]              (Fiche & Dossier Contractuel)
├ ○ /employes                   (Ressources Humaines Chauffeurs/Mécaniciens)
├ ƒ /employes/[id]              (Dossier Collaborateur & Permis)
├ ○ /maintenance                (Ordres de Travail & GMAO)
├ ○ /partenaires                (CRM Clients & Fournisseurs)
├ ƒ /partenaires/[id]           (Fiche Partenaire, Fiscalité & Timeline)
├ ○ /stock                      (Magasin, Pièces & Inventaire)
├ ○ /vehicules                  (Parc Automobile & Supervision)
└ ƒ /vehicules/[id]             (Fiche Véhicule, Documents, Constats & GMAO)

✓ Generating static pages using 16 workers (11/11) in 903ms
✓ 0 Errors, 0 Warnings
```

---

## 🚀 6. Instructions de Lancement & Prise en Main

### 6.1 Démarrage du Backend (FastAPI)
```bash
cd backend
# Activer l'environnement virtuel Python
.venv\Scripts\activate
# Lancer le serveur d'API avec rechargement automatique
uvicorn app.main:app --reload --port 8000
```
- **Documentation Swagger UI :** `http://localhost:8000/docs`
- **Documentation Redoc :** `http://localhost:8000/redoc`

### 6.2 Démarrage du Frontend (Next.js 16)
```bash
cd frontend
# Lancer le serveur de développement Next.js Turbopack
npm run dev
```
- **Application Web :** `http://localhost:3000`

### 6.3 Réinitialisation & Peuplement des Données de Démo
```bash
backend\.venv\Scripts\python.exe backend/seed.py
```

---

**Conclusion :** L'ERP E-Transport est dans un état pleinement fonctionnel, robuste et prêt pour la phase de polissage final et de déploiement en production.
