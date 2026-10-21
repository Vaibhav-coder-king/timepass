#!/bin/bash

echo ""
echo "========================================="
echo "  COGNIVA - Cognitive Gaming Platform"
echo "  Single Merged HTTP Service (Port 5000)"
echo "========================================="
echo ""

# ── Check Node.js ───────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "Download it from: https://nodejs.org"
    exit 1
fi

# ── Check Python ────────────────────────────────────────────────────────────
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "[ERROR] Python is not installed."
    echo "Download it from: https://www.python.org"
    exit 1
fi

# ── Install frontend deps if node_modules missing ───────────────────────────
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    npm install || { echo "[ERROR] npm install failed."; exit 1; }
fi

# ── Install backend deps ────────────────────────────────────────────────────
echo "[INFO] Ensuring backend dependencies are installed..."
$PYTHON_CMD -m pip install flask flask-cors --quiet

# ── Build frontend if dist is missing ───────────────────────────────────────
if [ ! -d "dist" ]; then
    echo "[INFO] Building frontend for single HTTP service..."
    npm run build
fi

# ── Open browser ────────────────────────────────────────────────────────────
(sleep 2 && (open http://localhost:5000 2>/dev/null || xdg-open http://localhost:5000 2>/dev/null)) &

echo ""
echo "========================================="
echo "  Single Merged HTTP Server Running!"
echo ""
echo "  Unified App : http://localhost:5000"
echo "  Mobile / LAN: http://<LAN-IP>:5000"
echo "========================================="
echo ""

$PYTHON_CMD -u backend/app.py
