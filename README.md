# CargoMind 3.0 (ShipMerge) — SIH26002

**AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (NER)**
*Smart India Hackathon 2026 | Problem Statement: SIH26002*

An offline-first, terrain-aware logistics consolidation, multi-modal routing (Road, Rail, NW-2 Inland Waterway, Drone), and real-time accessibility intelligence platform powered by PMGSY road networks, SRTM 30m DEM elevation models, and GatiShakti NFR infrastructure.

When you clone this repository, you need to create a virtual environment, start PostgreSQL and Redis, and seed the demo data.

---

### Option 1: Docker (Fastest, zero Python setup)

1. **Start all containers:**
   ```bash
   cd Backends
   docker compose up --build -d
   ```

2. **Seed all shipments, hubs, and routes:**
   ```bash
   docker compose exec api python -m scripts.seed_demo_data
   ```

3. **Access API Docs:**
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

### Option 2: Local Python Setup

1. **Navigate to the backend directory:**
   ```bash
   cd Backends
   ```

2. **Create and activate a virtual environment (Python >= 3.11):**
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows:**
     ```powershell
     python -m venv venv
     venv\Scripts\activate
     ```

3. **Install dependencies in editable mode:**
   ```bash
   pip install --upgrade pip
   pip install -e .
   ```

4. **Start PostgreSQL & Redis (via Docker):**
   ```bash
   docker compose up -d postgres redis
   ```

5. **Seed the database (Creates tables, tenants, hubs, routes, and shipments):**
   ```bash
   python -m scripts.seed_demo_data
   ```

6. **Start the FastAPI development server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

7. **Run tests:**
   ```bash
   pytest tests
   ```

---

### Option 3: Zero-Docker / SQLite Setup (Quickest for Windows without Docker)

If you do not have Docker Desktop running:

1. In `Backends/`, create or edit `.env`:
   ```ini
   DATABASE_URL=sqlite+aiosqlite:///./shipmerge.db
   SYNC_DATABASE_URL=sqlite:///./shipmerge.db
   ```
2. Activate your virtual environment and seed the SQLite database:
   ```powershell
   python -m scripts.seed_demo_data
   ```
3. Start the API server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

---

## 📦 What the Seeder Populates

Running `python -m scripts.seed_demo_data` automatically generates:
- **3 Default Tenants:**
  - `Shipper` (*ColdChain Logistics India*)
  - `Carrier` (*Indian Rail Express*)
  - `Admin` (*ShipMerge Admin Platform*)
- **15 Indian Logistics Hubs** (Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, etc.)
- **Highway & Rail Routes** connecting the hubs with average transit hours & costs
- **180-Day Historical Performance Data** per route for ML delay models
- **50 Pending Temperature-Sensitive Shipments** (Frozen, Chilled, Ambient)
- **IoT Temperature Excursion Logs**

---

## 🔑 Authentication & Multi-Tenancy

All shipment endpoints enforce tenant isolation:
- To test in Swagger (`/docs`), pass the Shipper Tenant ID in the `X-Tenant-ID` header, or leave it blank to auto-select the default tenant.
- To generate JWT tokens, call `POST /auth/token`.
