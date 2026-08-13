# 🏢 PROJECT LORE — E-Transport ERP

> **Single source of truth** for business logic, domain rules, user roles, and inter-module transactional flows.
> Derived from: `read_first.pdf`, Parts 1–7, class diagram, use cases, and activity diagrams.

---

## 1. Vision & Core Philosophy

The application replaces all Excel spreadsheets, paper documents, and scattered information with a **centralized relational database**. Every entity is entered **once** and referenced everywhere — the **no-double-data-entry** principle is sacred.

**Expected Outcome:** A digital platform providing complete traceability across the transport company's resources:
```
🚍 Parc → 👨‍✈ Personnel → 👥 Clients → 🔧 Maintenance → 📦 Pièces → 📄 Contrats → 💵 Cautions
```

---

## 2. User Roles & Permissions

### 2.1 Administrateur (Admin)
The **Administrateur inherits all Gestionnaire rights** plus supervisory capabilities:

| Capability | Description |
|---|---|
| Dashboard | View the general dashboard (Véhicules, Stock, Cautions counts & KPIs) |
| Expiration Alerts | Supervise document expiration alerts (Assurance, Contrôle technique, Contrats) |
| Stock & Maintenance Alerts | Monitor low-stock alerts and overdue maintenance |
| Global Audit Log | Consult the full history of all user actions across modules |
| Statistics | Analyze global statistics (Véhicules, Chauffeurs, Clients, Interventions, Cautions) |
| Coordinate | Coordinate with the responsible Gestionnaire when critical alerts arise |

**Admin Activity Flow:**
1. Login → General Dashboard
2. Check Alerts Panel (Expirations, Low Stock, Overdue Maintenance)
3. If critical alerts → Consult action history → Coordinate with responsible Gestionnaire
4. Analyze global statistics

### 2.2 Gestionnaire (Manager)
The operational user who performs all CRUD operations across the 7 modules:

| Domain | Actions |
|---|---|
| **Flotte & Personnel** | Add/Modify/Archive vehicles, manage vehicle documents (Assurance, Carte Grise, CT), declare accidents/constats, create/modify driver files, track driving license expiration |
| **CRM & Contrats** | Register clients/suppliers, manage multiple contacts per client, create contracts (Transport/Maintenance), add avenants, link cautions to contracts |
| **Cautions** | Create caution requests, update statut (Chez client → Retournée), auto-generate PDF from template |
| **Maintenance & Stock** | Record interventions (Préventive/Corrective), assign mechanics, select parts from stock (auto-deduction), plan next maintenance (date or km), record stock entries, perform inventories |

---

## 3. The 7 Core Modules

### 3.1 🚍 Module 1: Gestion des Véhicules (Fleet)

**Purpose:** Central digital file for every vehicle in the fleet.

**Entity: Véhicule**
| Field | Type | Constraint |
|---|---|---|
| `id` | UUID | PK |
| `immatriculation` | String | **Unique, Required** |
| `marque` | String | e.g., Mercedes-Benz |
| `modele` | String | e.g., Tourismo |
| `type` | Enum | Bus, Minibus, Voiture, Van, Autre |
| `nombrePlaces` | Int | |
| `annee` | Int | |
| `dateMiseCirculation` | Date | |
| `kilometrageActuel` | Float | |
| `statut` | Enum | `DISPONIBLE`, `EN_MISSION`, `MAINTENANCE`, `IMMOBILISE`, `HORS_SERVICE` |
| `coutTotal` | Float | Auto-calculated |

**Sub-entities:**
- **Documents** (3 principal: Assurance, Contrôle Technique, Carte Grise) — each with date validity tracking
- **Constats/Déclarations** — accident reports linked to vehicle + chauffeur, with tiers (third-party) info, photos, attachments
- **Coûts** — all costs associated with the vehicle

**Document Alert Thresholds:**
- 🟢 > 30 days remaining
- 🟠 ≤ 30 days remaining
- 🔴 Expired

**Vehicle Detail Page Layout:** Summary cards (Status, Documents valid/expired, Constats count) → Info Section → Documents Section → Costs Section

**Audit Log:** Every modification is recorded (who, when, what changed).

---

### 3.2 👨‍✈ Module 2: Gestion des Chauffeurs (Drivers)

**Purpose:** Complete personnel file for each driver.

**Entity hierarchy:** `Employe (Abstract)` → `Chauffeur`

| Field | Type | Notes |
|---|---|---|
| `matricule` | String | **Unique** |
| `nom`, `prenom` | String | |
| `photo` | File | |
| `dateNaissance` | Date | |
| `telephone` | String | |
| `adresse` | String | |
| `dateEmbauche` | Date | |
| `fonction` | String | Chauffeur / Chauffeur principal |
| `assurance` | Boolean | Assuré / Non assuré |
| `statut` | Enum | `ACTIF`, `ABSENT`, `SUSPENDU`, `QUITTE` |

**Sub-entity: Permis de Conduire**
| Field | Type |
|---|---|
| `numero` | String |
| `categories` | List<String> (B, D, D1, Autre) |
| `dateObtention` | Date |
| `dateExpiration` | Date |
| `scanPermis` | File |

**Administrative Documents:** Extrait de naissance, CNI, Résidence, Carte Chifa, Casier judiciaire — some with expiration tracking. Photo and Permis scan are stored once and referenced (no duplication).

---

### 3.3 👥 Module 3: Gestion des Clients / Agences (CRM)

**Purpose:** Centralize client/partner information. Acts as a mini-CRM.

**Entity hierarchy:** `Partenaire (Abstract)` → `Client` / `Fournisseur`

**Partenaire fields:**
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `nomCommercial` | String | |
| `nif` | String | Optional (needed for invoicing later) |
| `nis` | String | Optional |
| `registreCommerce` | String | Optional |
| `articleImposition` | String | Optional |
| `adresse` | String | |
| `wilaya` | String | Structured (dropdown) |
| `commune` | String | Structured (dropdown) |
| `codePostal` | String | |
| `telephonePrincipal` | String | |
| `email` | String | |
| `siteWeb` | String | |
| `statutCRM` | String | |

**Client-specific:** `typeClient` Enum: `AGENCE_VOYAGE`, `ENTREPRISE`, `HOTEL`, `ORGANISME`, `ASSOCIATION`, `PARTICULIER`, `AUTRE`

**Client Statuses:** 🟢 Actif, 🟡 Prospect, ⚫ Inactif, 🔴 Bloqué

**Sub-entity: Contact** (Many-to-one with Partenaire)
| Field | Type |
|---|---|
| `nom`, `prenom` | String |
| `fonction` | String |
| `telephone` | String |
| `email` | String |
| `whatsapp` | String |
| `estPrincipal` | Boolean |
| `notes` | Text |

**Key Rule:** A client can have **multiple contacts**. The `+ Ajouter un contact` pattern is essential.

**Documents & Notes:** Each client stores documents (RC, NIF, NIS, Contrat, Convention, Bon de commande). An interaction history (Appel, Email, Réunion) is maintained.

---

### 3.4 🔧 Module 4: Gestion de la Maintenance

**Purpose:** Complete technical history of every vehicle, with full traceability of mechanics and parts.

**Two Sub-modules:**

#### 4.4.1 👨‍🔧 Mécaniciens

**Entity hierarchy:** `Employe (Abstract)` → `Mecanicien`

| Field | Type |
|---|---|
| `fonction` | String |
| `specialite` | String |
| `typeMecanicien` | String |
| `experience` | String |
| `estResponsable` | Boolean |

Same documents structure as Chauffeur. Shows intervention history on their profile.

#### 4.4.2 🛠 Interventions

**Entity: Intervention**
| Field | Type | Constraint |
|---|---|---|
| `numero` | String | **Unique**, auto-generated (INT-YYYY-NNNNN) |
| `vehicule` | FK → Véhicule | **Required** |
| `type` | Enum | `PREVENTIVE`, `CORRECTIVE` |
| `categorie` | String | Vidange, Révision, Moteur, Freinage, Pneus, Électricité, Climatisation, Suspension, Transmission, Carrosserie, Diagnostic, Autre |
| `date` | Date | **Required** |
| `kilometrage` | Float | **Required** |
| `problemeConstate` | Text | |
| `diagnostic` | Text | |
| `travailEffectue` | Text | |
| `mecanicienResponsable` | FK → Mecanicien | Supervisor |
| `mecaniciensParticipants` | M2M → Mecanicien | Other techs |
| `statut` | Enum | `PLANIFIEE`, `EN_COURS`, `TERMINEE`, `ANNULEE` |
| `prochaineDateMaintenance` | Date | Optional |
| `prochaineKmMaintenance` | Float | Optional |

**Garage / Prestataire:** Each intervention can be internal or external. If external → Prestataire entity (name, phone, address).

**Documents:** Facture, Bon de réparation, Devis, Rapport technique, Photos avant/après.

**Parts Consumed:** Links to Stock module — selecting parts auto-deduces from stock.

**Next Maintenance Alerts:**
- 🟠 Date-based: "Vidange prévue dans 15 jours"
- 🟠 Km-based: "Vidange prévue à 250 000 km (actuel: 249 200 km)"
- 🔴 Overdue: "Maintenance dépassée de 1 200 km"

---

### 3.5 💵 Module 5: Gestion des Cautions (Bonds/Guarantees)

**Purpose:** Administrative tracking of financial bonds tied to contracts and tenders.

**Entity: Caution**
| Field | Type | Constraint |
|---|---|---|
| `numero` | String | **Unique** |
| `type` | Enum | Caution de soumission, Caution de bonne exécution |
| `client` | FK → Client | Selected from CRM module (no re-entry) |
| `montant` | Float | |
| `devise` | String | Default: DZD |
| `referenceType` | Enum | Contrat, Appel d'offre |
| `referenceNumero` | String | e.g., CTR-2026-001 |
| `objet` | Text | Object of the contract/tender |
| `dateEmission` | Date | |
| `statut` | Enum | `CREATION`, `CHEZ_CLIENT`, `RETOURNEE`, `MAIN_LEVEE` |
| `dateRetour` | Date | When returned |

**Lifecycle (State Machine):**
```
🟡 Création → 🟠 Chez le client → 🟢 Retournée → 📎 Main levée
```
When status = `RETOURNEE`, the **main levée PDF** document is mandatory.

**Killer Feature: Automatic PDF Generation**
```
Form Data → Injected into Company Template → Generated PDF → Auto-attached to Caution dossier
```
Post-generation screen: Preview, Download, Regenerate options.

---

### 3.6 📄 Module 6: Gestion des Contrats (Contracts)

**Purpose:** Centralize all company contracts (client and supplier).

**Entity: Contrat**
| Field | Type | Constraint |
|---|---|---|
| `reference` | String | **Unique** |
| `partieType` | Enum | Client, Fournisseur |
| `partie` | FK → Partenaire | Selected from existing (no re-entry) |
| `objet` | Text | |
| `typeContrat` | String | Transport, Maintenance, Fourniture, Location, Service, Sous-traitance, Assurance, Autre |
| `dateDebut` | Date | **Required** |
| `dateFin` | Date | |
| `montant` | Float | |
| `devise` | String | |
| `modeFacturation` | String | |
| `conditionsPaiement` | String | |
| `statut` | Enum | `ACTIF`, `EXPIRE` |

**Sub-entity: Avenant (Amendment)**
| Field | Type |
|---|---|
| `numero` | String |
| `date` | Date |
| `objet` | String |
| `description` | Text |
| `modifMontant` | Float |
| `nouvelleDateFin` | Date |
| Document PDF |

**Key Relationships:**
- Contract ↔ Cautions (one contract can have multiple cautions: soumission + bonne exécution)
- Contract → Documents (Contrat signé, Avenants, Cahier des charges, Bon de commande)
- Contract → Historique (timeline of all events)

**Expiration Alerts:**
- 🟢 Active
- 🟠 Expires in ≤ 30 days
- 🔴 Expires in ≤ 7 days
- ⚫ Expired

---

### 3.7 📦 Module 7: Gestion du Stock & Pièces Détachées (Inventory)

**Purpose:** Manage spare parts with full traceability from supplier to vehicle.

**Entity: Pièce (Part)**
| Field | Type | Constraint |
|---|---|---|
| `reference` | String | **Unique** |
| `designation` | String | |
| `categorie` | String | Configurable (Filtres, Pneus, Freinage, Électricité, Moteur, Climatisation, Suspension, Transmission, Éclairage, Carrosserie, Consommables, Autres) |
| `marque` | String | |
| `modeleCompatibilite` | String | |
| `unite` | String | Pièce, Litre, Kg, etc. |
| `stockActuel` | Int | **Calculated from movements** |
| `stockMinimum` | Int | Threshold for alerts |
| `emplacement` | String | Format: Zone-Rayon-Étagère (e.g., A-03-02) |
| `description` | Text | |

**Entity: MouvementStock (Stock Movement)**
| Field | Type |
|---|---|
| `type` | Enum: `ENTREE`, `SORTIE`, `INVENTAIRE` |
| `quantite` | Int |
| `date` | Date |
| `motif` | String (Intervention, Vente, Perte, Autre) |
| `ecartInventaire` | Int (for inventory adjustments) |

**Critical Rule:** Stock is **NEVER** manually set. `stockActuel` is always the **sum of all movements**. Every change creates a movement record.

**Stock Entry (📥):** Pièce + Quantité + Fournisseur + Date + Référence document (Bon de livraison) + File attachment

**Stock Exit (📤):** Pièce + Quantité + Motif + Intervention reference + Véhicule + Mécanicien → Auto-deduction

**Inventory (🔎):** Compare system stock vs. physical count. Discrepancies must be justified (Perte, Casse, Erreur de saisie, Autre).

**Stock Alerts:**
- 🟢 Normal (stock > minimum)
- 🟠 Low (stock ≤ minimum but > 0)
- 🔴 Rupture (stock = 0)

**Dashboard:** Total references, Normal/Low/Rupture counts, Monthly entries/exits.

**Supplier Link:** A piece can have **multiple suppliers**, each with their own pricing (for future comparison features).

---

## 4. Cross-Module Transactional Flows

### 4.1 Maintenance → Stock Transaction (Critical Path)

```
Gestionnaire opens "Nouvelle Intervention"
  → Selects Véhicule (BUS-004)
  → Selects Catégorie (Freinage)
  → Assigns Mécanicien Responsable
  → Selects Pièces (Plaquettes frein × 2)
  
SYSTEM:
  → Checks stock (Plaquettes: 6 available)
  → Creates MouvementStock (SORTIE, qty=2, motif=Intervention)
  → Updates Pièce stockActuel (6 → 4)
  → IF stockActuel <= stockMinimum → Generate "Stock Faible" Alert
  
Gestionnaire:
  → Writes diagnostic + travaux effectués
  → Sets prochaine maintenance (date OR km OR both)
  → Sets statut = TERMINEE
  
SYSTEM → COMMIT Transaction (ACID)
```

### 4.2 Contract → Caution Transaction

```
Gestionnaire initiates "Nouveau Contrat"
  → IF client/supplier exists → Select from Partenaire list
  → IF new → Create Partenaire (info + contacts) [no double entry]
  → Fill contract details (Objet, Montant, Dates)
  → IF contract requires caution:
      → Open "Nouvelle Demande de Caution"
      → Link caution to contract reference
      → SYSTEM: Inject data into PDF template
      → SYSTEM: Generate "CAUTION_GENERATED.pdf"
      → SYSTEM: Auto-attach PDF to caution dossier
  → Set caution statut = "Chez le client"
  → Attach supporting documents (Cahier des charges, etc.)
  → Set contract statut = "Actif"
```

### 4.3 Full Supply Chain Traceability

```
🏭 Fournisseur → 📥 Entrée Stock → 📦 Stock → 📤 Sortie → 🔧 Intervention → 🚍 Véhicule + 👨‍🔧 Mécanicien
```

Every link in this chain is a recorded, traceable transaction.

---

## 5. Global Dashboard

The home page provides a synthetic view:

| Widget | Content |
|---|---|
| 🚍 Véhicules | Total count |
| 👨‍✈ Chauffeurs | Total active |
| 👥 Clients | Total active |
| 🔧 Maintenance | Interventions in progress |
| 📦 Stock | Total references |
| 💵 Cautions | Active cautions |
| ⚠ Alertes | Expired documents, overdue maintenance, low stock, expiring contracts |

---

## 6. Entity: Document (Universal)

Used across ALL modules (Véhicules, Chauffeurs, Mécaniciens, Clients, Contrats, Cautions, Interventions, Stock entries):

| Field | Type |
|---|---|
| `nom` | String |
| `type` | String |
| `urlFichier` | String (Supabase Storage URL) |
| `dateEmission` | Date |
| `dateExpiration` | Date (nullable) |
| `statutValidite` | String (auto-computed from dates) |

Accepted formats: PDF, JPG, JPEG, PNG.

---

## 7. Enumeration Reference

| Enum | Values |
|---|---|
| `StatutVehicule` | DISPONIBLE, EN_MISSION, MAINTENANCE, IMMOBILISE, HORS_SERVICE |
| `StatutEmploye` | ACTIF, ABSENT, SUSPENDU, QUITTE |
| `TypePartenaire` | AGENCE_VOYAGE, ENTREPRISE, HOTEL, ORGANISME, ASSOCIATION, PARTICULIER, AUTRE |
| `StatutCaution` | CREATION, CHEZ_CLIENT, RETOURNEE, MAIN_LEVEE |
| `StatutContrat` | ACTIF, EXPIRE |
| `CategorieIntervention` | PREVENTIVE, CORRECTIVE |
| `TypeMouvement` | ENTREE, SORTIE, INVENTAIRE |

---

## 8. Architectural Decision: Partenaire Unification

The class diagram shows a critical architectural choice:

```
Partenaire (Abstract)
├── Client (typeClient: TypePartenaire)
└── Fournisseur (specialite: String)
```

Both share the same base table and contact system. A **Contrat** references a `Partenaire`, not directly a Client or Fournisseur. This enables:
- A single contract form for both client and supplier contracts
- No duplication of partner management UI
- Future-proof for additional partner types
