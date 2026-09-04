# CargoMind / ShipMerge — Comprehensive Feature Directory

**CargoMind** (also referred to as **ShipMerge** in backend services) is an enterprise multi-tenant logistics consolidation, multi-modal freight orchestration, and cold-chain risk prediction platform. It combines **Google OR-Tools CP-SAT combinatorial optimization**, **Arrhenius & $Q_{10}$ physics-based thermal degradation kinetics**, and **gradient boosting machine learning models** with a **Swiss-style interactive frontend**.

---

## 1. Multi-Tenancy, Authentication & Access Control

* **Multi-Tenant Architecture**: Complete tenant isolation across database queries and operations via `Tenant` models and `TenantContext` session middleware.
* **Role-Based Access Control (RBAC)**:
  * **`shipper`**: Manages shipments, sets SLA deadlines and max cost targets, generates consolidation plans.
  * **`carrier`**: Restricted views on shipments (masks shipper financial and commercial metadata via `CarrierShipmentRead`).
  * **`admin`**: System-wide oversight across all network nodes, corridors, and tenants.
* **Dual Authentication Mechanisms**:
  * **JWT Bearer Authentication**: Secure HS256 tokens issued via `POST /api/auth/token` with tenant ID and role claims.
  * **Header-Based Auth (`X-Tenant-ID` & `X-Tenant-Role`)**: Frictionless developer and API testing support across Swagger UI and external test runners.
* **Dynamic Tenant Registration**: On-demand tenant onboarding via `POST /api/auth/register-tenant` with auto-provisioning for demo runs.

---

## 2. Freight Manifest & Shipment Management

* **Full Shipment Lifecycle Tracking**: Tracks shipment progression through states: `pending` $\rightarrow$ `consolidated` $\rightarrow$ `in_transit` $\rightarrow$ `delivered` (or `cancelled`).
* **Thermal Classification Management**:
  * **`frozen`** ($-18^\circ\text{C}$): Deep cold-chain for seafood, meat, and biologics.
  * **`chilled`** ($+4^\circ\text{C}$): Temperature-controlled produce, dairy, and confectionery.
  * **`ambient`** ($+22^\circ\text{C}$): Standard non-refrigerated cargo.
* **SLA & Cost Constraints**: Captures shipment-specific physical dimensions (weight in kg, volume in $\text{m}^3$), hard SLA delivery deadlines, and shipper-defined maximum allowable budgets.
* **Rapid Dispatch Ingestion Form**: Interactive frontend form to create, validate, and queue new consignments with automated waybill generation and real-time injection into the active CP-SAT batch.
* **Multi-Status Manifest Filtering**: Real-time filtering by status (`All`, `In Transit`, `Pre-cooling`, `Crossdocking`, `Delivered`).

---

## 3. National Logistics Network Topology & Hub Telemetry

* **Intermodal Network Graph Modeling**: Graph representation of nodes (`Hub`) and edges (`Route`), exposed via `GET /api/network/graph`.
* **Hub Classification & Cold Storage Telemetry**:
  * **Origin Hubs, Destination Hubs & Transfer Crossdocks** with active cold storage capacity quotas in kilograms.
  * Real-time capacity utilization meters and active reefer loading dock monitoring.
* **Multi-Modal Corridors**:
  * **Road Reefer Arterials**: High-flexibility highway routes (e.g., NH-16, NH-53, NH-316).
  * **Dedicated Freight Corridor (DFC) Rail Wagons**: High-capacity, lower-cost, lower-carbon refrigerated rail lines.
* **Corridor Scoring Engine**: Multi-criteria candidate scoring combining average transit time, base cost per kg, and historical corridor reliability.
* **Interactive Swiss Vector Map**: Custom SVG interactive geospatial network map visualizing hubs, rural aggregation nodes (Villages A–D), coastal export gateways (Paradeep Port), and animated DFC rail motion streams.

---

## 4. Combinatorial Freight Consolidation (Google OR-Tools CP-SAT)

* **Multi-Objective Optimization Solver**: Powered by `ConsolidationSolver` using Constraint Programming (`cp_model.CpModel`):
  $$\min \left( w_{\text{cost}} \cdot \text{Cost} + w_{\text{risk}} \cdot \text{Risk} + \text{VehicleFixedCost} \cdot y_k \right)$$
* **Strict Constraint Satisfaction**:
  * **Thermal Isolation**: Hard guarantee that incompatible temperature classes (e.g., Frozen and Ambient) are never co-loaded in the same reefer vehicle.
  * **Payload Weight & Volumetric Capacities**: Strict bounds on maximum vehicle payload (e.g., $10{,}000\,\text{kg}$) and volume (e.g., $40\,\text{m}^3$).
  * **SLA & Cost Compliance**: Enforces that assigned departure schedules and routes deliver within the SLA deadline without exceeding maximum cost limits.
* **Pareto Frontier Generation & Plan Ranking**: Runs multiple solver iterations with varying objective weights (cost-heavy, risk-heavy, balanced) and computes non-dominated Pareto plans ranked 1 to $K$:
  * **Plan Alpha**: Maximum Rail DFC consolidation (highest cost savings).
  * **Plan Beta**: High-speed highway reefer relay (shortest SLA).
  * **Plan Gamma**: Zero thermal defect marine shield (lowest risk).
* **Heuristic Greedy Fallback**: Built-in fallback heuristic solver ensuring sub-second response times if the CP-SAT model encounters tight timeout bounds.

---

## 5. Physics-Informed Cold-Chain & Thermal Kinetics

* **Arrhenius Degradation Model**: Real-time reaction velocity modeling of shelf-life depletion based on thermal activation energy ($E_a \approx 62\text{--}110\,\text{kJ/mol}$):
  $$k(T) = A \cdot \exp\left(-\frac{E_a}{R \cdot T}\right)$$
* **$Q_{10}$ Temperature Acceleration Kinetics**: Computes dynamic thermal exposure acceleration factors across frozen, chilled, and ambient classes:
  $$\text{Acceleration Factor} = Q_{10}^{\frac{T_{\text{actual}} - T_{\text{target}}}{10}}$$
* **Shelf-Life Depletion & Excursion Logging**:
  * Calculates exact remaining shelf life percentage and effective thermal exposure hours.
  * Ingestion and analysis of IoT thermistor logs and door-opening excursions.
* **Interactive Thermal Playground**: Live UI sliders for external ambient temperature ($20^\circ\text{C}\text{--}52^\circ\text{C}$), transit duration ($4\text{--}48\,\text{hrs}$), and reefer insulation R-values ($R\text{-}2\text{ to }R\text{-}8$) with live reaction readout.

---

## 6. Machine Learning & Predictive Risk Engine

* **Unified Risk Prediction Service**: Multi-factor engine combining spoilage kinetics and route delay probabilities via `POST /api/risk/predict`.
* **XGBoost & Gradient Boosting Delay Predictor**:
  * Trained on historical corridor performance records across seasons, departure hours, transport modes, and route reliability scores.
  * Predicts delay probability and estimated delay hours to adjust effective cold-chain transit time dynamically.
* **ML-Corrected Shelf-Life Regressor**: Supervised gradient boosting regressor fine-tuning base kinetic equations against real-world container heat exchange dynamics.

---

## 7. Explainable AI (XAI) & Constraint Tracing

* **SHAPley Feature Attribution**: Computes contribution weights for key decision drivers (monsoon weather impact, rail punctuality advantage, traffic congestion vulnerabilities, deep-freeze thermal decay).
* **Constraint Tracing Engine**: Instruments the solver's decisions and generates human-readable rationales for why shipments were grouped, vehicle modes were chosen, and specific routes were assigned.
* **Autonomous Strategy Narrator**: Generates tailored syntheses on the frontend:
  * **Executive Brief**: Business KPIs, total ₹ savings, and compliance percentages.
  * **Operator / Driver Dispatch**: Target container setpoints, transfer dwell buffers, and emergency precooling protocols.
  * **Custom Natural Query Console**: Interactive query box for route scenarios and temperature spikes.

---

## 8. Disruption Simulation Lab & Auto-Mitigation

* **Synthetic Shock Injector**: Allows testing network resilience under critical operational bottlenecks:
  * **Valley Heatwave Spike**: Ambient temperature spikes (e.g., $39^\circ\text{C}$ in Brahmaputra tea corridor) $\rightarrow$ automatically triggers emergency precooling and throttles refrigeration by $+12\%$.
  * **Monsoon Flash Flooding**: NH-27 Nagaon-Guwahati arterial flash flooding $\rightarrow$ autonomous rerouting via inland waterway barge link (NW-2 Pandu Port).
  * **Mountain Landslide & Rail Siding Maintenance**: $4.0\,\text{hr}$ bottleneck on Dima Hasao Lumding-Silchar hill railway $\rightarrow$ auto-diverts time-critical vaccines to 4x4 Bolero campers while maintaining bulk tea cargo on rail.
* **Real-Time Audit & Incident Feed**: Chronological log of real-time IoT events, precooling buffers, CP-SAT batch executions, and resolved alerts.

---

## 9. Frontend Architecture & Swiss-Style UI Experience

* **Modern Next.js 16 (App Router) & React 19 Stack**: Ultra-responsive zero-card layout with high-contrast typography and $1\text{px}$ hairline dividers.
* **Kinetic Brand Intro HUD Screen**: Fullscreen SVG reticle sequence calibrating solver parameters and Arrhenius kinetics on initial visit with session persistence and manual replay.
* **Global Command Palette (`⌘K` / `Ctrl+K`)**: Modal search index across all 7 sections, 15 hubs/villages, active waybills, and AI tools with keyboard navigation.
* **Scroll-Synchronized Breadcrumb HUD**: Sticky top navigation tracking section transitions dynamically (`00 // OVERVIEW` through `06 // INCIDENTS`).
* **AI Intelligence Console**: Dedicated multi-objective simulator page with custom route presets, modal mix sliders, $\text{CO}_2$ carbon abatement calculations, and SHAP attribution meters.
* **Architecture & Manifesto Page**: Technical specifications, operational benchmarks against conventional 3PL, and enterprise inquiry ingestion.

---

## 10. Data Engineering, Infrastructure & Developer Tooling

* **Automated Demo Seeder**: `seed_demo_data.py` generating:
  * 3 default tenants (`Shipper`, `Carrier`, `Admin`).
  * 15 Indian logistics hubs with geo-coordinates and capacities.
  * Multi-modal road & rail routes with 180-day historical performance logs.
  * 50 pending temperature-sensitive shipments and IoT sensor logs.
* **Synthetic Data Generator**: `synthetic_generator.py` producing realistic logistics dataset distributions for training and evaluation.
* **Database & Migration Support**: Full async SQLAlchemy schema with PostgreSQL (`asyncpg`), SQLite fallback (`aiosqlite`), and Alembic version migration tracking.
* **Containerization**: Docker Compose orchestration for FastAPI API container, PostgreSQL, and Redis cache.
* **Test Suite**: Automated Pytest suite covering CP-SAT solver constraints, ML risk predictors, shipment repositories, and tenant isolation policies.

---

## Summary Matrix of Core Capabilities

| Category | Primary Technologies | Key Features |
| :--- | :--- | :--- |
| **Optimization** | Google OR-Tools CP-SAT | Multi-shipment bin packing, route/mode assignment, thermal compatibility isolation, Pareto ranking |
| **Physics & Kinetics** | Arrhenius Equations, $Q_{10}$ Kinetics | Reaction velocity calculation, cumulative thermal exposure, container insulation R-value modeling |
| **Machine Learning** | XGBoost, Scikit-Learn | Corridor delay probability estimation, ML-corrected shelf-life degradation regressor |
| **Explainability** | SHAPley Attribution, Constraint Tracer | Feature importance weights, plain-language decision rationales, automated dispatch synthesis |
| **Multi-Tenancy** | FastAPI, JWT, SQLAlchemy Async | Shipper/Carrier/Admin RBAC, carrier payload redaction, header/token dual authentication |
| **Frontend UI/UX** | Next.js 16, React 19, Tailwind CSS v4 | Swiss editorial design, interactive SVG network map, Command Palette (`⌘K`), stress testing lab |
