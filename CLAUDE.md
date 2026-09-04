# CLAUDE.md — CargoMind 3.0 / ShipMerge Context

## 1. Project Overview
**CargoMind (ShipMerge)** is an enterprise multi-tenant rural last-mile logistics consolidation, multi-modal freight orchestration, and cold-chain risk prediction platform (Team NASCENT - SIH 2026).
- **Core Capabilities**: Multi-objective freight optimization (Google OR-Tools CP-SAT), physics-informed thermal kinetics (Arrhenius & $Q_{10}$), ML delay & spoilage prediction (XGBoost), RoadSense IRI road roughness scoring, intermodal network routing (Road, FOIS Rail, Riverine, Mountain SRTM), explainable AI (SHAP & constraint tracing), and multilingual voice/chat assistant (English, Hindi, Assamese).

---

## 2. Tech Stack & Directory Structure

```
├── Backends/                   # FastAPI Python backend (Python >= 3.11)
│   ├── app/
│   │   ├── api/                # FastAPI routers (auth, shipments, dispatch, network, risk, roadsense, sync, chat)
│   │   ├── core/               # Auth (JWT/headers), config, database (Async SQLAlchemy)
│   │   ├── models/             # SQLAlchemy ORM models (Tenant, Shipment, Hub, Route, Vehicle, RoadSense, etc.)
│   │   ├── repositories/       # Data access layer (async CRUD per entity)
│   │   ├── schemas/            # Pydantic v2 request/response schemas
│   │   └── services/
│   │       ├── optimizer/      # Google OR-Tools CP-SAT solver, fairness calculator (Gini index)
│   │       ├── risk/           # Arrhenius/Q10 kinetics + XGBoost delay & spoilage predictors
│   │       ├── network/        # NetworkX graph, route scorer, SRTM terrain elevation service
│   │       ├── roadsense/      # Road roughness (IRI) scorer & OpenStreetMap seeder
│   │       ├── explain/        # SHAP feature attribution & constraint tracing
│   │       └── llm_service.py  # Groq/Gemini multilingual assistant (EN, HI, AS)
│   ├── ml/                     # ML training pipelines & pre-trained pickle artifacts
│   ├── scripts/                # Database seeders (seed_demo_data.py)
│   └── tests/                  # Pytest test suite
├── frontend/                   # Next.js 16 (App Router), React 19, Tailwind CSS v4
│   ├── app/[locale]/           # Localized pages (Overview, AI Intelligence, About)
│   ├── components/             # Swiss-style UI, interactive vector map, search palette (⌘K), AI chatbot
│   ├── i18n/ & messages/       # next-intl translations (en, hi, as)
│   ├── lib/api/                # Frontend API client modules (shipments, dispatch, risk, roadsense, sync)
└── run_cargomind.sh            # One-click runner for backend + frontend
```

---

## 3. Essential Commands

### Quick Start
```bash
./run_cargomind.sh                          # Runs seed script, FastAPI (port 8000), and Next.js (port 3000)
```

### Backend Commands (from `/Backends`)
```bash
# Environment & Dependencies
python3 -m venv venv && source venv/bin/activate
pip install -e .

# Database Seeding & Running (SQLite default or PostgreSQL)
python -m scripts.seed_demo_data            # Seeds 3 tenants, 15 hubs, routes, shipments, vehicles
uvicorn app.main:app --reload --port 8000   # Swagger docs at http://localhost:8000/docs

# Testing
pytest tests                                # Run test suite (CP-SAT, tenant isolation, risk, endpoints)
```

### Frontend Commands (from `/frontend`)
```bash
npm install
npm run dev                                 # Start Next.js on http://localhost:3000
npm run build                               # Production build
npm run lint                                # ESLint check
```

---

## 4. Key Subsystems & Business Logic

### 1. Combinatorial Freight Optimization (`app/services/optimizer/`)
- **Solver**: `ConsolidationSolver` using Google OR-Tools CP-SAT (`cp_model.CpModel`).
- **Objective**: Minimize `(w_cost * Cost + w_risk * SpoilageRisk + VehicleFixedCost * y_k)`.
- **Hard Constraints**:
  - **Thermal Isolation**: Incompatible temperature classes (`frozen: -18°C`, `chilled: +4°C`, `ambient: +22°C`) NEVER share the same vehicle/compartment.
  - **Capacity & SLA**: Strict vehicle payload (weight kg, volume m³) and delivery deadline compliance.
- **Fairness & Rural Coverage**: `fairness_calculator.py` computes Gini index across rural hub allocations to avoid starvation of remote clusters.
- **Pareto Ranking**: Generates Plan Alpha (Max Rail/cost saver), Plan Beta (Express Road/fastest SLA), and Plan Gamma (Zero-defect cold shield).

### 2. Physics & ML Cold-Chain Risk (`app/services/risk/` & `ml/`)
- **Arrhenius Kinetics**: Reaction velocity $k(T) = A \cdot \exp(-E_a / (R \cdot T))$ modeling thermal shelf-life decay.
- **$Q_{10}$ Temperature Acceleration**: Dynamic acceleration factor $Q_{10}^{\frac{T_{actual} - T_{target}}{10}}$.
- **ML Regressors**: XGBoost models predicting route delay probabilities based on weather, season, elevation profile, and mode.

### 3. RoadSense & Terrain Engine (`app/services/roadsense/` & `network/`)
- Computes **Roadability Score** based on International Roughness Index (IRI), surface type (paved/unpaved/gravel), width, and weather degradation.
- Integrates SRTM elevation gradients to penalize heavy vehicle fuel/transit time on steep ghats.

### 4. Multi-Tenancy & Auth Architecture (`app/core/auth.py`, `deps.py`)
- **Tenants**: `shipper`, `carrier`, `admin`.
- **Tenant Context**: Enforced in every query. Dual auth supported:
  - Header-based: `X-Tenant-ID` and `X-Tenant-Role` (for fast API/Swagger testing).
  - JWT Bearer: Issued via `POST /api/auth/token`.
- **Role Masking**: Carrier views mask shipper commercial metadata via `CarrierShipmentRead`.

### 5. Offline Sync & Multilingual Assistant (`app/api/sync.py`, `chat.py`)
- Offline-first IndexedDB buffer sync via `POST /api/sync/batch` for remote drivers.
- AI Chatbot supporting English, Hindi, and Assamese (`en`, `hi`, `as`) with natural language query explainability.

---

## 5. Primary API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/token` | `POST` | Issue JWT token with tenant claims |
| `/api/auth/register-tenant` | `POST` | Register a new tenant |
| `/api/shipments` | `GET` / `POST` | List / Create consignments (tenant isolated) |
| `/api/dispatch/match` | `POST` | Execute CP-SAT consolidation & route matching |
| `/api/dispatch/fairness-metrics` | `GET` | Rural hub allocation fairness & Gini score |
| `/api/network/graph` | `GET` | Intermodal logistics graph (nodes & edges) |
| `/api/risk/predict` | `POST` | Physics + ML thermal risk & delay assessment |
| `/api/roadsense/score` | `GET` | Road roughness & vehicle suitability scoring |
| `/api/sync/batch` | `POST` | Offline mutation queue batch synchronization |
| `/api/chat/assistant` | `POST` | Multilingual logistics assistant query |

---

## 6. Code & Architectural Conventions

- **Backend**:
  - Python 3.11+, async-first with FastAPI and `SQLAlchemy[asyncio]`.
  - Use `AsyncSession` dependency via `get_db` / `get_tenant_db`.
  - Repositories encapsulate database queries (`app/repositories/*`).
  - Use Pydantic v2 schemas (`app/schemas/*`) for API validation; keep models (`app/models/*`) clean.
  - Supports SQLite fallback (`sqlite+aiosqlite:///./shipmerge.db`) and PostgreSQL (`postgresql+asyncpg://...`).
- **Frontend**:
  - Next.js 16 App Router with React 19 and Tailwind CSS v4.
  - Localization via `next-intl` under `[locale]` (always handle `en`, `hi`, `or`).
  - Strict Swiss editorial design aesthetic (high contrast, 1px borders, monospace metrics, zero heavy gradients).
  - State management uses lightweight hooks & local stores (`syncStore.ts` for offline state).
