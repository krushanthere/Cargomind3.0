#!/usr/bin/env bash

# ==============================================================================
# CargoMind (Team NASCENT - SIH 2026) Unified Runner
# AI-Optimized Rural Last-Mile Logistics Network with Real Elevation & Rail FOIS
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/Backends"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
VENV_DIR="${PROJECT_ROOT}/.venv"

echo "======================================================================"
echo "  🚀 Starting CargoMind 3.0 Platform (Smart India Hackathon 2026)"
echo "  📦 Team NASCENT - Rural Last-Mile Multi-Modal Logistics Network"
echo "======================================================================"

# 1. Check Virtual Environment
if [ -d "$VENV_DIR" ]; then
    PYTHON_EXEC="${VENV_DIR}/bin/python"
    UVICORN_EXEC="${VENV_DIR}/bin/uvicorn"
elif command -v python3 &> /dev/null; then
    PYTHON_EXEC="python3"
    UVICORN_EXEC="uvicorn"
else
    echo "❌ Error: Python 3 not found. Please install Python 3.10+."
    exit 1
fi

# 2. Seed Database if needed
echo ""
echo "📊 [1/3] Verifying and Seeding Multi-Modal Rural Logistics Data..."
cd "${BACKEND_DIR}"
${PYTHON_EXEC} -m scripts.seed_demo_data || true

# 3. Start Backend in Background
echo ""
echo "⚙️  [2/3] Launching FastAPI Dynamic Dispatch Engine on http://127.0.0.1:8000 ..."
${UVICORN_EXEC} app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# 4. Start Frontend in Background
echo ""
echo "🌐 [3/3] Launching Next.js Swiss Logistics Dashboard on http://localhost:3000 ..."
cd "${FRONTEND_DIR}"
npm run dev &
FRONTEND_PID=$!

# Trap signals to ensure graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down CargoMind platform..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Clean shutdown complete. Good luck Team NASCENT at SIH 2026!"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "======================================================================"
echo "  🎉 CARGOMIND IS LIVE AND RUNNING!"
echo "  • Web Portal Dashboard: http://localhost:3000"
echo "  • FastAPI API Docs:     http://127.0.0.1:8000/docs"
echo "  • Multi-Modal Modes:    Road, Rail (FOIS), Mountain (SRTM), Riverine"
echo "  • AI Assistant:         Multi-lingual Voice & Offline-First Assistant"
echo "======================================================================"
echo "  Press [CTRL+C] at any time to stop all services."
echo "======================================================================"

wait
