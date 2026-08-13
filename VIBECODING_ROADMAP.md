# 🗺️ VIBECODING ROADMAP — E-Transport ERP

> **Phase-by-phase execution plan** from initial setup to final deployment.
> Each phase is broken into **atomic, executable tasks** with clear acceptance criteria.
> This is the strict build order — no phase begins until the prior one is complete.

---

## Phase 0: Context Assimilation & Foundation ✅

- [x] Read and analyze all documentation (cahier des charges Parts 1–7)
- [x] Read TechStack.pdf and Design_system_E_Transport.pdf
- [x] Analyze all UML diagrams (class, use case, activity)
- [x] Generate `PROJECT_LORE.md` — business logic bible
- [x] Generate `TECH_STANDARDS.md` — technical rules
- [x] Generate `VIBECODING_ROADMAP.md` — this file

---

## Phase 1: Project Scaffolding & Infrastructure

> **Goal:** Bootable frontend + backend with auth, connected to Supabase.

### 1.1 Frontend Initialization
- [ ] Initialize Next.js (App Router) or Vite + React project in `frontend/`
- [ ] Configure TypeScript strict mode
- [ ] Install & configure Tailwind CSS with design system tokens
- [ ] Install Shadcn UI + Radix Primitives
- [ ] Install Zustand for state management
- [ ] Set up the `globals.css` with all design tokens (colors, typography, spacing)
- [ ] Configure Google Fonts (Inter)

### 1.2 Backend Initialization
- [ ] Initialize FastAPI project in `backend/`
- [ ] Set up project structure (`models/`, `schemas/`, `routers/`, `services/`)
- [ ] Configure Pydantic v2 settings
- [ ] Set up SQLAlchemy/SQLModel ORM
- [ ] Configure Alembic for migrations
- [ ] Set up CORS middleware (allow frontend origin)
- [ ] Create `config.py` with environment variable management
- [ ] Create `Dockerfile` for local development

### 1.3 Supabase Setup
- [ ] Create Supabase project
- [ ] Configure PostgreSQL database
- [ ] Set up Supabase Auth (email/password)
- [ ] Create user roles: `admin`, `gestionnaire`
- [ ] Configure Supabase Storage buckets (one per module)
- [ ] Set up Row Level Security policies (basic)
- [ ] Connect backend to Supabase via connection string
- [ ] Connect frontend to Supabase client SDK

### 1.4 Auth Flow
- [ ] Build login page (frontend) with design system styling
- [ ] Implement Supabase Auth integration (sign in, sign out, session management)
- [ ] Create FastAPI auth dependency (JWT verification)
- [ ] Implement role-based route protection (frontend)
- [ ] Implement role-based API guards (backend)
- [ ] Build auth Zustand store

**✅ Acceptance:** User can log in, be redirected to dashboard, and backend rejects unauthenticated requests.

---

## Phase 2: Shell Layout & Navigation

> **Goal:** The app shell (sidebar, topbar, content area) is fully functional and navigable.

### 2.1 Layout Components
- [ ] Build `Sidebar` component (240px, dark theme `#111827`)
  - [ ] Navigation links for all 7 modules with icons
  - [ ] Active state highlighting (Primary Base)
  - [ ] User role display at bottom
  - [ ] Collapsible on mobile
- [ ] Build `TopBar` component
  - [ ] Global search input
  - [ ] Notification bell (alert count badge)
  - [ ] User profile dropdown (name, role, logout)
- [ ] Build `ContentArea` wrapper (proper padding, max-width for forms)
- [ ] Build `PageHeader` component (H1 title + action buttons)

### 2.2 Routing
- [ ] Set up all routes (Next.js App Router or React Router)
  - [ ] `/dashboard`
  - [ ] `/vehicules`, `/vehicules/[id]`, `/vehicules/nouveau`
  - [ ] `/chauffeurs`, `/chauffeurs/[id]`, `/chauffeurs/nouveau`
  - [ ] `/clients`, `/clients/[id]`, `/clients/nouveau`
  - [ ] `/maintenance/interventions`, `/maintenance/interventions/[id]`, `/maintenance/interventions/nouvelle`
  - [ ] `/maintenance/mecaniciens`, `/maintenance/mecaniciens/[id]`
  - [ ] `/cautions`, `/cautions/[id]`, `/cautions/nouvelle`
  - [ ] `/contrats`, `/contrats/[id]`, `/contrats/nouveau`
  - [ ] `/stock/pieces`, `/stock/pieces/[id]`
  - [ ] `/stock/entrees/nouvelle`
  - [ ] `/stock/sorties/nouvelle`
  - [ ] `/stock/inventaires`
- [ ] Create placeholder pages for all routes (with proper `<h1>` titles)

### 2.3 Shared UI Components
- [ ] `StatusBadge` — maps enum → pill color using design tokens
- [ ] `DataTable` — configurable columns, sort, pagination, row actions (View, Edit, Archive)
- [ ] `FileUpload` — drag & drop, accepted formats (PDF, JPG, JPEG, PNG)
- [ ] `DocumentCard` — displays document with name, dates, validity status, download link
- [ ] `AlertBanner` — color-coded alert cards (🟢🟠🔴)
- [ ] `ConfirmDialog` — for destructive actions (archive)
- [ ] `EmptyState` — illustration + message for empty lists
- [ ] Generate placeholder images for empty states

**✅ Acceptance:** Full navigation between all module pages, consistent layout, all shared components functional in Storybook or test page.

---

## Phase 3: Database Schema & Migrations

> **Goal:** Complete PostgreSQL schema with all tables, relationships, enums, and indexes.

### 3.1 Enum Types
- [ ] `statut_vehicule` (DISPONIBLE, EN_MISSION, MAINTENANCE, IMMOBILISE, HORS_SERVICE)
- [ ] `statut_employe` (ACTIF, ABSENT, SUSPENDU, QUITTE)
- [ ] `type_partenaire` (AGENCE_VOYAGE, ENTREPRISE, HOTEL, ORGANISME, ASSOCIATION, PARTICULIER, AUTRE)
- [ ] `statut_caution` (CREATION, CHEZ_CLIENT, RETOURNEE, MAIN_LEVEE)
- [ ] `statut_contrat` (ACTIF, EXPIRE)
- [ ] `categorie_intervention` (PREVENTIVE, CORRECTIVE)
- [ ] `type_mouvement` (ENTREE, SORTIE, INVENTAIRE)

### 3.2 Core Tables
- [ ] `vehicules` — with unique immatriculation, all fields from schema
- [ ] `employes` — abstract base (single table inheritance with `type` discriminator)
- [ ] `chauffeurs` — extends employes
- [ ] `mecaniciens` — extends employes
- [ ] `permis` — 1:1 with chauffeur
- [ ] `partenaires` — abstract base (with `type` discriminator: client/fournisseur)
- [ ] `clients` — extends partenaires
- [ ] `fournisseurs` — extends partenaires
- [ ] `contacts` — many-to-one with partenaires
- [ ] `contrats` — FK to partenaire, unique reference
- [ ] `avenants` — FK to contrat
- [ ] `cautions` — FK to partenaire, unique numero
- [ ] `interventions` — FK to vehicule, FK to mecanicien (responsable)
- [ ] `intervention_mecaniciens` — junction table (M2M participants)
- [ ] `intervention_pieces` — junction table (pieces used in intervention + quantity)
- [ ] `pieces` — unique reference, stock tracking
- [ ] `mouvements_stock` — FK to piece, FK to intervention (optional)
- [ ] `constats` — FK to vehicule, FK to chauffeur
- [ ] `documents` — polymorphic (FK to any entity via `entity_type` + `entity_id`)

### 3.3 Infrastructure
- [ ] Add `id`, `created_at`, `updated_at`, `archived_at` to every table
- [ ] Create `updated_at` trigger function
- [ ] Add unique indexes (immatriculation, matricule, reference, numero)
- [ ] Add FK indexes for all foreign keys
- [ ] Generate Alembic migration
- [ ] Run migration against Supabase

**✅ Acceptance:** All tables created in Supabase, relationships verified, migration reversible.

---

## Phase 4: Module 1 — Véhicules (Fleet Management)

> **Goal:** Full CRUD for vehicles with documents, constats, and alert system.

### 4.1 Backend
- [ ] Create ORM model: `Vehicule`
- [ ] Create Pydantic schemas: `VehiculeCreate`, `VehiculeRead`, `VehiculeUpdate`
- [ ] Create router: `/api/v1/vehicules` (list, get, create, update, archive)
- [ ] Implement search & filter (immatriculation, marque, type, statut)
- [ ] Implement pagination
- [ ] Vehicle documents sub-resource: `/api/v1/vehicules/{id}/documents`
- [ ] Vehicle constats sub-resource: `/api/v1/vehicules/{id}/constats`
- [ ] Constat CRUD (create with tiers info, photos)
- [ ] Document upload via Supabase Storage
- [ ] Document validity status computation (auto-alert thresholds)
- [ ] Audit log entries on create/update

### 4.2 Frontend
- [ ] **List Page:** DataTable with columns (Immatriculation, Marque/Modèle, Type, Statut, Actions)
- [ ] Search bar + filters (Type, Statut)
- [ ] `+ Ajouter un véhicule` button → form page
- [ ] **Create/Edit Form:** All fields with validation
- [ ] **Detail Page:** Summary cards (Status, Documents count, Constats count) → tabbed sections
  - [ ] Tab: Informations (editable)
  - [ ] Tab: Documents (Assurance, CT, Carte Grise with validity badges + file viewer)
  - [ ] Tab: Constats (list + `+ Nouvelle déclaration` form)
  - [ ] Tab: Historique (audit log)
- [ ] Generate vehicle type images (Bus, Minibus, Voiture, Van)

**✅ Acceptance:** Complete vehicle lifecycle — add, view, edit, archive, manage documents with expiration alerts, declare accidents.

---

## Phase 5: Module 2 — Chauffeurs (Drivers)

> **Goal:** Full driver file management with permits and document tracking.

### 5.1 Backend
- [ ] Create ORM models: `Employe`, `Chauffeur`, `Permis`
- [ ] Create schemas & router: `/api/v1/chauffeurs`
- [ ] Permis sub-resource: create/update/read
- [ ] Administrative documents management
- [ ] Expiration tracking for Permis and documents

### 5.2 Frontend
- [ ] **List Page:** DataTable (Matricule, Nom, Fonction, Statut, Actions)
- [ ] **Create/Edit Form:** Personal info + Professional info
- [ ] **Detail Page:** 
  - [ ] Section: Informations personnelles (with photo)
  - [ ] Section: Permis de conduire (categories, dates, scan)
  - [ ] Section: Assurance
  - [ ] Section: Documents administratifs (checklist with status)

**✅ Acceptance:** Full driver file with permit tracking and document expiration alerts.

---

## Phase 6: Module 3 — Clients / Agences (CRM)

> **Goal:** Client management with multi-contact, documents, and notes.

### 6.1 Backend
- [ ] Create ORM models: `Partenaire`, `Client`, `Fournisseur`, `Contact`
- [ ] Create schemas & router: `/api/v1/clients`, `/api/v1/fournisseurs`
- [ ] Contacts CRUD: `/api/v1/clients/{id}/contacts`
- [ ] Documents sub-resource
- [ ] Notes/interaction history

### 6.2 Frontend
- [ ] **List Page:** DataTable (Client, Type, Contact principal, Statut) + filters
- [ ] **Create/Edit Form:** Type selection, identification, coordonnées, adresse (wilaya/commune dropdowns)
- [ ] **Detail Page:**
  - [ ] Section: Informations
  - [ ] Section: Contacts (multi-contact management, `+ Ajouter un contact`)
  - [ ] Section: Documents
  - [ ] Section: Notes
  - [ ] Section: Historique des interactions

**✅ Acceptance:** Client CRM with structured addresses, multiple contacts, and interaction tracking.

---

## Phase 7: Module 4 — Maintenance (Interventions & Mécaniciens)

> **Goal:** Complete maintenance tracking with mechanic assignment and parts consumption.

### 7.1 Backend — Mécaniciens
- [ ] Create ORM model: `Mecanicien`
- [ ] Create schemas & router: `/api/v1/mecaniciens`
- [ ] Mechanic intervention history

### 7.2 Backend — Interventions
- [ ] Create ORM model: `Intervention` (with M2M mecaniciens, M2M pieces)
- [ ] Create schemas & router: `/api/v1/interventions`
- [ ] Auto-numbering (INT-YYYY-NNNNN)
- [ ] Link to véhicule (vehicule info auto-populated)
- [ ] Mécanicien responsable + participants
- [ ] Parts selection (from stock) — prepare for stock integration
- [ ] Next maintenance scheduling (date or km)
- [ ] Documents/photos attachment
- [ ] Vehicle maintenance history: `/api/v1/vehicules/{id}/interventions`

### 7.3 Frontend
- [ ] **Mécaniciens List & Detail Pages** (same pattern as Chauffeurs)
- [ ] **Interventions List:** DataTable (N°, Véhicule, Type, Catégorie, Date, Statut)
- [ ] **New Intervention Form:**
  - [ ] Vehicle selector (dropdown with search)
  - [ ] Type (Préventive/Corrective) + Catégorie
  - [ ] Date + Kilométrage
  - [ ] Mécanicien responsable + participants selectors
  - [ ] Description (Problème, Diagnostic, Travail effectué)
  - [ ] Parts section (piece selector + quantity) — connected to stock in Phase 9
  - [ ] Garage/Prestataire (internal vs. external)
  - [ ] Documents upload
  - [ ] Next maintenance fields
- [ ] **Intervention Detail Page**

**✅ Acceptance:** Full intervention lifecycle, mechanic assignment, next maintenance scheduling.

---

## Phase 8: Module 5 & 6 — Cautions & Contrats

> **Goal:** Contract management with avenant support, caution lifecycle, and PDF generation.

### 8.1 Backend — Contrats
- [ ] Create ORM model: `Contrat`, `Avenant`
- [ ] Create schemas & router: `/api/v1/contrats`
- [ ] Partenaire selection (from existing Clients/Fournisseurs)
- [ ] Avenants CRUD: `/api/v1/contrats/{id}/avenants`
- [ ] Cautions linked to contrat: `/api/v1/contrats/{id}/cautions`
- [ ] Expiration alert computation
- [ ] Documents management

### 8.2 Backend — Cautions
- [ ] Create ORM model: `Caution`
- [ ] Create schemas & router: `/api/v1/cautions`
- [ ] Client selection from CRM (no re-entry)
- [ ] Lifecycle state machine (CREATION → CHEZ_CLIENT → RETOURNEE → MAIN_LEVEE)
- [ ] **PDF Generation Service:** 
  - [ ] Create PDF template (WeasyPrint or ReportLab)
  - [ ] Data injection from caution form
  - [ ] Upload generated PDF to Supabase Storage
  - [ ] Auto-attach to caution document list
- [ ] Main levée document requirement enforcement

### 8.3 Frontend — Contrats
- [ ] **List Page:** DataTable (Référence, Partie, Type, Date, Statut) + filters
- [ ] **New Contract Form:** Party type (Client/Fournisseur), party selector, contract details, financial info
- [ ] **Detail Page:** Info, Cautions linked, Documents, Avenants, Historique

### 8.4 Frontend — Cautions
- [ ] **List Page:** DataTable (N°, Client, Montant, Réf. contrat, Date, Statut)
- [ ] **New Caution Request Form:** Type, Client selector, Montant, Référence, Objet
- [ ] **PDF Generation Button** → Confirmation page (Preview, Download, Regenerate)
- [ ] **Detail Page:** Complete caution file with status transitions
- [ ] Status update workflow (with main levée upload requirement)

**✅ Acceptance:** Contract lifecycle with avenants, caution state machine, working PDF auto-generation.

---

## Phase 9: Module 7 — Stock & Pièces Détachées

> **Goal:** Full inventory management with automatic stock deduction during maintenance.

### 9.1 Backend
- [ ] Create ORM models: `Piece`, `MouvementStock`
- [ ] Create schemas & router: `/api/v1/pieces`, `/api/v1/stock`
- [ ] Stock entry endpoint (create MouvementStock ENTREE)
- [ ] Stock exit endpoint (create MouvementStock SORTIE)
- [ ] **Maintenance Integration:** Auto-deduction service
  - [ ] When intervention saved with pieces → create SORTIE movements transactionally
  - [ ] Validate stock availability before deduction
  - [ ] Trigger low-stock alert if threshold crossed
- [ ] Inventory endpoint (INVENTAIRE movement with écart justification)
- [ ] Stock movement history: `/api/v1/pieces/{id}/mouvements`
- [ ] Supplier link (piece ↔ fournisseurs, many-to-many)
- [ ] Stock alerts computation

### 9.2 Frontend
- [ ] **Stock Dashboard:** KPI cards (Total refs, Normal, Low, Rupture, Monthly in/out)
- [ ] **Pieces List:** DataTable (Référence, Désignation, Stock, Minimum, État)
- [ ] **Piece Detail:** Info, emplacement, fournisseurs, movement history
- [ ] **Stock Entry Form:** Piece selector, quantity, fournisseur, date, document (BL)
- [ ] **Stock Exit Form:** Piece, quantity, motif, linked intervention/véhicule/mécanicien
- [ ] **Inventory Page:** Compare system vs. real stock, justify discrepancies
- [ ] **Update Intervention Form:** Connect piece selector to real stock data (live stock check, auto-sortie)

**✅ Acceptance:** Full stock traceability from supplier entry to maintenance consumption, with live alerts.

---

## Phase 10: Dashboard & Alerts System

> **Goal:** Central command center with real-time KPIs and alert management.

### 10.1 Backend
- [ ] Dashboard aggregation endpoint: `/api/v1/dashboard`
  - [ ] Total vehicles, active drivers, active clients
  - [ ] Interventions in progress
  - [ ] Total stock references
  - [ ] Active cautions count
- [ ] Alerts aggregation endpoint: `/api/v1/alertes`
  - [ ] Expired/expiring documents (vehicles, drivers)
  - [ ] Overdue/upcoming maintenance
  - [ ] Low stock / rupture alerts
  - [ ] Expiring contracts

### 10.2 Frontend
- [ ] **Dashboard Page:**
  - [ ] KPI cards grid (6 modules with counts and trend indicators)
  - [ ] Alerts panel (color-coded, clickable → navigate to relevant entity)
  - [ ] Recent activity feed
- [ ] **Notification Bell:** Alert count badge, dropdown with categorized alerts
- [ ] Generate dashboard illustration assets

**✅ Acceptance:** Dashboard shows accurate real-time data, alerts are clickable and lead to the relevant entity.

---

## Phase 11: Polish, UX & Responsiveness

> **Goal:** Production-quality UI with animations, responsive design, and edge case handling.

### 11.1 UI Polish
- [ ] Add loading skeletons for all data-fetching pages
- [ ] Add micro-animations (page transitions, card hover effects, button feedback)
- [ ] Add toast notifications (success/error for all CRUD operations)
- [ ] Implement optimistic updates where appropriate
- [ ] Add keyboard shortcuts (Ctrl+N for new, Escape to close modals)
- [ ] Dark mode support (optional, stretch goal)

### 11.2 Responsive Design
- [ ] Sidebar collapses to icon-only on tablet, hidden on mobile (hamburger menu)
- [ ] DataTables become responsive cards on mobile
- [ ] Forms stack properly on narrow viewports
- [ ] TopBar adapts to mobile layout

### 11.3 Error Handling
- [ ] Global error boundary (frontend)
- [ ] 404 page for invalid routes
- [ ] Graceful API error display (toast + inline validation)
- [ ] Network failure recovery (retry logic)
- [ ] Empty state handling for every list/table

### 11.4 Accessibility
- [ ] Keyboard navigation for all interactive elements
- [ ] ARIA labels on all form inputs and buttons
- [ ] Screen reader support for status badges
- [ ] Focus management in modals and dialogs

**✅ Acceptance:** App feels professional, handles all edge cases gracefully, fully usable on tablet.

---

## Phase 12: Testing & Quality Assurance

> **Goal:** Confidence in every critical path before deployment.

### 12.1 Backend Testing
- [ ] Unit tests for all services (stock calculations, alert thresholds, PDF generation)
- [ ] Integration tests for critical transactional flows:
  - [ ] Intervention + stock deduction (rollback on failure)
  - [ ] Caution lifecycle + PDF generation
  - [ ] Contract → Caution linking
- [ ] API endpoint tests for all CRUD operations
- [ ] Auth/authorization tests (role-based access)

### 12.2 Frontend Testing
- [ ] Component tests for shared components (StatusBadge, DataTable, FileUpload)
- [ ] Integration tests for critical forms (vehicle creation, intervention with parts)
- [ ] Navigation tests (all routes accessible based on role)

### 12.3 End-to-End
- [ ] Full user journey: Create vehicle → Add documents → Create intervention → Use parts → Verify stock deduction
- [ ] Full user journey: Create client → Create contract → Create caution → Generate PDF → Return caution

**✅ Acceptance:** All critical paths tested, no regressions on core business logic.

---

## Phase 13: Deployment & DevOps

> **Goal:** Application live and accessible.

### 13.1 Backend Deployment
- [ ] Finalize Dockerfile
- [ ] Deploy to Render (Free Web Service)
- [ ] Configure environment variables (Supabase connection, secrets)
- [ ] Verify API accessibility

### 13.2 Frontend Deployment
- [ ] Deploy to Vercel (Hobby Plan)
- [ ] Configure environment variables (Supabase URL, Anon key, API URL)
- [ ] Verify SSL certificate
- [ ] Configure custom domain (optional)

### 13.3 CI/CD
- [ ] Set up GitHub Actions workflow:
  - [ ] Lint (ESLint + Ruff)
  - [ ] Test (pytest + vitest)
  - [ ] Build
  - [ ] Auto-deploy to Vercel/Render on `main` push

### 13.4 Monitoring
- [ ] Set up basic error tracking (Sentry free tier or similar)
- [ ] Set up uptime monitoring for API

**✅ Acceptance:** App live, accessible via URL, CI/CD auto-deploys on push.

---

## Phase 14: Data Seeding & Handoff

> **Goal:** Realistic demo data and documentation for the client.

- [ ] Create seed script with realistic Algerian transport company data:
  - [ ] 10+ vehicles (Mercedes, Iveco, Hyundai buses)
  - [ ] 15+ chauffeurs
  - [ ] 10+ clients/agencies (Oran region)
  - [ ] 5+ mécaniciens
  - [ ] 20+ interventions with parts consumption
  - [ ] 5+ contracts with avenants
  - [ ] 8+ cautions in various states
  - [ ] 50+ stock items across categories
- [ ] Generate all UI images (vehicle types, avatars, empty states)
- [ ] Write user manual / quick start guide
- [ ] Record demo video walkthrough

**✅ Acceptance:** Client can log in and see a fully populated, realistic ERP system.

---

## Summary Timeline

| Phase | Description | Est. Effort |
|---|---|---|
| 0 | Context Assimilation | ✅ Done |
| 1 | Scaffolding & Infrastructure | 2–3 days |
| 2 | Shell Layout & Navigation | 1–2 days |
| 3 | Database Schema | 1 day |
| 4 | Véhicules Module | 2–3 days |
| 5 | Chauffeurs Module | 1–2 days |
| 6 | Clients/CRM Module | 1–2 days |
| 7 | Maintenance Module | 2–3 days |
| 8 | Cautions & Contrats | 2–3 days |
| 9 | Stock Module | 2–3 days |
| 10 | Dashboard & Alerts | 1–2 days |
| 11 | Polish & Responsiveness | 2 days |
| 12 | Testing & QA | 2 days |
| 13 | Deployment | 1 day |
| 14 | Seeding & Handoff | 1 day |
| **Total** | | **~20–28 days** |
