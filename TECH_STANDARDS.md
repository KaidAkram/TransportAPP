# ⚙️ TECH STANDARDS — E-Transport ERP

> **Strict technical rules** governing the entire project. Every line of code must comply with these standards.
> Derived from: `TechStack.pdf`, `Design_system_E_Transport.pdf`, and architectural decisions from the class diagram.

---

## 1. Architecture Overview

**N-Tier Decoupled Architecture** with 3 clear layers:

```
┌─────────────────────────────────────────────────────┐
│  CLIENT TIER — React SPA (Next.js or Vite)          │
│  Hosted on Vercel (Hobby Plan)                      │
├─────────────────────────────────────────────────────┤
│  APPLICATION TIER — FastAPI (Python)                │
│  RESTful API · Hosted on Render (Free Web Service)  │
├─────────────────────────────────────────────────────┤
│  DATA TIER — Supabase (Free Tier)                   │
│  PostgreSQL · Supabase Auth · Supabase Storage      │
└─────────────────────────────────────────────────────┘
```

All 7 modules communicate via a **RESTful API** secured with JWT tokens from Supabase Auth.

---

## 2. Frontend Stack

| Technology | Purpose | Version Constraint |
|---|---|---|
| **React.js** | UI Framework | Latest stable (v18+) |
| **Next.js** OR **Vite** | Build tool / routing | Next.js (App Router) preferred for SSR; Vite for pure SPA |
| **Tailwind CSS** | Utility-first styling | v3.x+ (with 8px grid system) |
| **Shadcn UI** | Component library | Latest — unstyled, accessible, customizable |
| **Radix Primitives** | Accessible primitives | Underlying Shadcn components |
| **Zustand** | Global state management | Lightweight, no boilerplate |
| **TypeScript** | Type safety | Strict mode enabled |

### 2.1 Frontend Folder Structure

```
frontend/
├── public/
│   └── assets/              # Static images, generated assets
├── src/
│   ├── app/                 # Next.js App Router pages (or routes/ for Vite)
│   │   ├── (auth)/          # Login, password reset
│   │   ├── dashboard/       # Main dashboard
│   │   ├── vehicules/       # Module 1
│   │   │   ├── page.tsx     # List view
│   │   │   ├── [id]/        # Detail view
│   │   │   └── nouveau/     # Create form
│   │   ├── chauffeurs/      # Module 2
│   │   ├── clients/         # Module 3
│   │   ├── maintenance/     # Module 4
│   │   │   ├── interventions/
│   │   │   └── mecaniciens/
│   │   ├── cautions/        # Module 5
│   │   ├── contrats/        # Module 6
│   │   └── stock/           # Module 7
│   │       ├── pieces/
│   │       ├── entrees/
│   │       ├── sorties/
│   │       └── inventaires/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components (Button, Input, Table, etc.)
│   │   ├── layout/          # Sidebar, TopBar, ContentArea
│   │   ├── shared/          # StatusBadge, DocumentCard, AlertBanner, FileUpload
│   │   └── modules/         # Module-specific compound components
│   │       ├── vehicules/
│   │       ├── chauffeurs/
│   │       ├── clients/
│   │       ├── maintenance/
│   │       ├── cautions/
│   │       ├── contrats/
│   │       └── stock/
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions, API client, constants
│   │   ├── api.ts           # Axios/fetch wrapper for FastAPI
│   │   ├── supabase.ts      # Supabase client initialization
│   │   ├── constants.ts     # Enums, status maps, color tokens
│   │   └── utils.ts         # Date formatting, alert computation, etc.
│   ├── stores/              # Zustand stores
│   │   ├── authStore.ts
│   │   └── alertStore.ts
│   ├── types/               # TypeScript interfaces mirroring Pydantic models
│   │   ├── vehicule.ts
│   │   ├── chauffeur.ts
│   │   ├── client.ts
│   │   ├── intervention.ts
│   │   ├── caution.ts
│   │   ├── contrat.ts
│   │   └── stock.ts
│   └── styles/
│       └── globals.css      # Tailwind base + custom tokens
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 2.2 Component Design Rules

1. **Every component uses design tokens** from `globals.css` — no hardcoded hex values.
2. **Status badges** are always `StatusBadge` components, mapping enum → color + label.
3. **Data tables** follow the design system: `#F9FAFB` header, white rows, `1px #E5E7EB` borders.
4. **Forms** are constrained in width inside `ContentArea`; tables span full width.
5. **All interactive elements** must have unique `id` attributes for testing.
6. **File upload** components accept: PDF, JPG, JPEG, PNG only.

---

## 3. Backend Stack

| Technology | Purpose |
|---|---|
| **FastAPI** | API framework (Python 3.11+) |
| **Pydantic v2** | Request/response validation & serialization |
| **SQLAlchemy** OR **SQLModel** | ORM for PostgreSQL |
| **Alembic** | Database migrations |
| **WeasyPrint** OR **ReportLab** | PDF generation (Cautions, Contracts) |
| **python-jose** | JWT validation (Supabase tokens) |
| **Uvicorn** | ASGI server |

### 3.1 Backend Folder Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app creation, CORS, middleware
│   ├── config.py            # Environment variables (Supabase URL, keys)
│   ├── dependencies.py      # Auth dependency, DB session
│   ├── models/              # SQLAlchemy/SQLModel ORM models
│   │   ├── __init__.py
│   │   ├── vehicule.py
│   │   ├── employe.py       # Abstract base for Chauffeur & Mecanicien
│   │   ├── chauffeur.py
│   │   ├── mecanicien.py
│   │   ├── permis.py
│   │   ├── partenaire.py    # Abstract base for Client & Fournisseur
│   │   ├── client.py
│   │   ├── fournisseur.py
│   │   ├── contact.py
│   │   ├── contrat.py
│   │   ├── avenant.py
│   │   ├── caution.py
│   │   ├── intervention.py
│   │   ├── piece.py
│   │   ├── mouvement_stock.py
│   │   ├── constat.py
│   │   ├── document.py
│   │   └── enums.py         # All enumerations
│   ├── schemas/             # Pydantic schemas (Create, Read, Update)
│   │   ├── vehicule.py      # VehiculeCreate, VehiculeRead, VehiculeUpdate
│   │   └── ...              # One file per entity, same pattern
│   ├── routers/             # API route handlers
│   │   ├── __init__.py
│   │   ├── vehicules.py
│   │   ├── chauffeurs.py
│   │   ├── clients.py
│   │   ├── mecaniciens.py
│   │   ├── interventions.py
│   │   ├── cautions.py
│   │   ├── contrats.py
│   │   ├── stock.py
│   │   ├── documents.py
│   │   └── dashboard.py
│   ├── services/            # Business logic layer
│   │   ├── stock_service.py         # Stock entry/exit/inventory logic
│   │   ├── maintenance_service.py   # Intervention + auto stock deduction
│   │   ├── caution_service.py       # Caution lifecycle + PDF generation
│   │   ├── alert_service.py         # Expiration checks, stock alerts
│   │   └── pdf_service.py           # PDF template injection & generation
│   ├── templates/           # PDF templates (Caution, Contract)
│   └── utils/
│       ├── auth.py          # Supabase JWT verification
│       └── storage.py       # Supabase Storage upload/download helpers
├── alembic/                 # Database migrations
│   ├── versions/
│   └── env.py
├── alembic.ini
├── requirements.txt
├── Dockerfile
└── .env
```

### 3.2 API Routing Conventions

**Base URL:** `/api/v1/`

| HTTP Method | Pattern | Purpose |
|---|---|---|
| `GET` | `/api/v1/{module}` | List all (paginated, filterable) |
| `GET` | `/api/v1/{module}/{id}` | Get one by ID |
| `POST` | `/api/v1/{module}` | Create new |
| `PUT` | `/api/v1/{module}/{id}` | Full update |
| `PATCH` | `/api/v1/{module}/{id}` | Partial update (e.g., status change) |
| `DELETE` | `/api/v1/{module}/{id}` | Archive (soft delete, never hard delete) |

**Nested Resources:**
- `GET /api/v1/vehicules/{id}/documents` — Documents for a vehicle
- `GET /api/v1/vehicules/{id}/constats` — Constats for a vehicle
- `GET /api/v1/vehicules/{id}/interventions` — Maintenance history
- `GET /api/v1/contrats/{id}/avenants` — Amendments for a contract
- `GET /api/v1/contrats/{id}/cautions` — Cautions linked to a contract
- `GET /api/v1/clients/{id}/contrats` — Contracts for a client
- `GET /api/v1/pieces/{id}/mouvements` — Stock movements for a part
- `POST /api/v1/cautions/{id}/generer-pdf` — Trigger PDF generation

**Special Endpoints:**
- `GET /api/v1/dashboard` — Aggregated dashboard data
- `GET /api/v1/alertes` — All active alerts (documents, stock, maintenance, contracts)

### 3.3 Business Logic Rules

1. **Soft Delete Only:** Archive entities, never hard delete. Maintain audit trail.
2. **Stock Integrity:** Every stock change MUST create a `MouvementStock`. Direct stock value mutation is forbidden.
3. **Transactional Boundaries:** Intervention creation + stock deduction must be a single DB transaction. If stock deduction fails, the entire intervention rolls back.
4. **PDF Generation:** Caution PDF is generated server-side using WeasyPrint. The generated file is uploaded to Supabase Storage, and its URL is stored in the `Document` table linked to the `Caution`.
5. **Auto-numbering:** Interventions (`INT-YYYY-NNNNN`), Cautions (`CAU-YYYY-NNN`), Contrats (`CTR-YYYY-NNN`) are auto-generated sequentially.
6. **Alert Computation:** Alerts are computed on-the-fly (not stored), based on current dates and thresholds.

---

## 4. Database Layer (Supabase / PostgreSQL)

### 4.1 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `vehicules`, `mouvements_stock` |
| Columns | `snake_case` | `date_mise_circulation`, `stock_actuel` |
| Primary Keys | `id` (UUID, auto-generated) | `id UUID DEFAULT gen_random_uuid()` |
| Foreign Keys | `{entity}_id` | `vehicule_id`, `client_id` |
| Enums | PostgreSQL ENUM type | `statut_vehicule` |
| Indexes | `idx_{table}_{column}` | `idx_vehicules_immatriculation` |
| Timestamps | `created_at`, `updated_at` | Auto-managed |

### 4.2 Schema Rules

1. **Every table** has: `id` (UUID PK), `created_at` (TIMESTAMPTZ DEFAULT NOW()), `updated_at` (TIMESTAMPTZ, trigger-managed).
2. **Soft delete** via `archived_at` (TIMESTAMPTZ, nullable). Archived records are excluded from default queries.
3. **Unique constraints** on: `vehicules.immatriculation`, `employes.matricule`, `pieces.reference`, `contrats.reference`, `cautions.numero`.
4. **Foreign keys** with `ON DELETE RESTRICT` (prevent orphans). Never CASCADE delete.
5. **Inheritance** (Employe → Chauffeur/Mecanicien, Partenaire → Client/Fournisseur) implemented as **joined table inheritance** or **single table with discriminator column**.

### 4.3 Supabase Services

| Service | Usage |
|---|---|
| **PostgreSQL** | All relational data |
| **Supabase Auth** | User authentication (Admin, Gestionnaire roles via custom claims) |
| **Supabase Storage** | File uploads organized in buckets: `vehicules/`, `chauffeurs/`, `mecaniciens/`, `clients/`, `contrats/`, `cautions/`, `interventions/`, `stock/` |
| **Row Level Security (RLS)** | Optional — enforce role-based access at DB level |

---

## 5. Design System Tokens

### 5.1 Color Palette

```css
/* Primary */
--color-primary-base: #1E40AF;    /* Sidebar, active states, primary buttons */
--color-primary-light: #DBEAFE;   /* Subtle backgrounds, table hover */
--color-accent: #3B82F6;          /* Interactive elements, text links */

/* Semantic (Status) */
--color-success: #10B981;         /* Disponible, Actif, Valide, Retournée */
--color-warning: #F59E0B;         /* En mission, Absent, Expire bientôt, Stock faible */
--color-danger: #EF4444;          /* Immobilisé, Suspendu, Expiré, Rupture */
--color-neutral: #6B7280;         /* Hors service, Quitté, Inactif */

/* Status Badge Backgrounds */
--color-success-bg: #D1FAE5;      /* Badge bg for success */
--color-success-text: #065F46;    /* Badge text for success */

/* Backgrounds & Surfaces */
--color-background: #F3F4F6;      /* App background */
--color-surface: #FFFFFF;          /* Cards, containers, tables */

/* Text */
--color-text-primary: #111827;    /* Titles, data */
--color-text-secondary: #4B5563;  /* Labels, table headers, helper text */

/* Borders */
--color-border: #E5E7EB;          /* Table row borders */
--color-table-header: #F9FAFB;    /* Table header background */
```

### 5.2 Typography

```css
/* Font Family: Inter or Roboto (tabular figures optimized) */
--font-family: 'Inter', 'Roboto', sans-serif;

/* Type Scale */
--text-h1: 24px;     /* Semi-Bold 600 · Page titles */
--text-h2: 18px;     /* Medium 500 · Section titles */
--text-body: 14px;   /* Regular 400 · Body text */
--text-meta: 12px;   /* Regular 400 · Metadata, small labels */
```

### 5.3 Spacing (8px Grid)

All spacing values are multiples of 8: `8px`, `16px`, `24px`, `32px`, `40px`, `48px`.

### 5.4 Layout

| Element | Specification |
|---|---|
| **Sidebar** | 240px fixed width, dark theme (`#111827`) |
| **Top Bar** | Global search, user profile, notification bell (alerts) |
| **Content Area** | Full width for tables; constrained width (`max-w-3xl`) for forms |

### 5.5 Component Specs

| Component | Style |
|---|---|
| **Status Badge (Pill)** | 12px Medium font, `border-radius: 16px`, colored bg + text per status |
| **Data Table Header** | `#F9FAFB` bg, `#4B5563` text, 12px UPPERCASE, letter-spacing |
| **Data Table Row** | White bg, 1px `#E5E7EB` bottom border |
| **Primary Button** | `#1E40AF` bg, white text, `border-radius: 6px` |
| **Secondary Button** | Ghost/outline, `#1E40AF` text + border |
| **Danger Button** | Ghost, `#EF4444` text |

---

## 6. Asset Generation Pipeline (Image Generation)

### 6.1 Strategy

When a UI component requires an image (vehicle thumbnails, user avatars, empty state illustrations, dashboard icons), use the **generate_image tool** to create assets that match the design system:

- **Vehicle Thumbnails:** Clean, minimal illustrations of buses, minibuses, vans on white/transparent background. Modern flat-design style matching the blue primary palette.
- **User Avatars:** Professional placeholder avatars with neutral expressions, consistent circular crop style.
- **Empty States:** Friendly illustrations for empty lists ("No vehicles yet", "No interventions recorded").
- **Dashboard Icons:** Flat, consistent iconography using the primary blue and semantic colors.

### 6.2 Rules

1. All generated images must match the **clean, modern, highly scannable** aesthetic of the design system.
2. Images must be saved to `public/assets/generated/` in the frontend project.
3. Use consistent dimensions: thumbnails (128×128), avatars (64×64), illustrations (400×300).
4. Never use placeholder stock photos — all visual assets are generated to maintain brand consistency.

---

## 7. Authentication & Authorization

### 7.1 Flow

```
User → Supabase Auth (email/password) → JWT Token → Frontend stores token
  → API requests include Bearer token → FastAPI validates via Supabase JWT verification
  → Role extracted from JWT custom claims (admin | gestionnaire)
```

### 7.2 Role-Based Access

| Route Pattern | Admin | Gestionnaire |
|---|---|---|
| `GET /dashboard` | ✅ | ✅ |
| `GET /alertes` | ✅ (all) | ✅ (own modules) |
| `GET /audit-log` | ✅ | ❌ |
| All CRUD operations | ✅ | ✅ |
| User management | ✅ | ❌ |

---

## 8. DevOps & Deployment

| Concern | Tool |
|---|---|
| **Code Repository** | GitHub (private repos) |
| **Frontend Hosting** | Vercel (Hobby Plan) — auto-deploy from `main` branch |
| **Backend Hosting** | Render (Free Web Service) — containerized deployment |
| **Containerization** | Docker (development + Render deployment) |
| **CI/CD** | GitHub Actions (lint → test → build → deploy) |
| **Environment Variables** | `.env` files (local), Vercel/Render env config (production) |

---

## 9. Code Quality Rules

1. **TypeScript** strict mode on frontend — no `any` types.
2. **Pydantic** strict validation on backend — all request/response bodies typed.
3. **No inline styles** on frontend — everything through Tailwind utilities or design tokens.
4. **API responses** always return consistent JSON: `{ data: T, message: string, status: number }`.
5. **Error responses** follow RFC 7807: `{ detail: string, status: number, type: string }`.
6. **Every entity** has Create, Read, Update schemas (no raw model exposure via API).
7. **Pagination** on all list endpoints: `?page=1&per_page=25&sort_by=created_at&order=desc`.
8. **Search & Filter** via query parameters: `?search=mercedes&statut=DISPONIBLE&type=Bus`.
