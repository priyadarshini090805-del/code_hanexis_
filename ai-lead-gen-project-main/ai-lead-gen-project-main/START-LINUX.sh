#!/bin/bash
# Run on Linux:  bash START-LINUX.sh   (or  ./START-LINUX.sh  after chmod +x)cd "$(dirname "$0")"

echo "============================================================"
echo "  AI Lead Generation - Local Demo Launcher"
echo "============================================================"

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed."
  echo "Install Node.js LTS from https://nodejs.org then run this again."
  read -r -p "Press Enter to exit..."
  exit 1
fi

# 2. Install dependencies (first run only)
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first run, a few minutes)..."
  npm install --legacy-peer-deps || { echo "[ERROR] Install failed."; read -r -p "Enter to exit..."; exit 1; }
fi

# 3. Create local DB + demo data (first run only)
if [ ! -f "prisma/dev.db" ]; then
  echo "Setting up the local database and demo data..."
  npm run setup:local || { echo "[ERROR] DB setup failed."; read -r -p "Enter to exit..."; exit 1; }
fi

echo ""
echo "============================================================"
echo "  Starting the app... a browser will open shortly."
echo "  Login:  demo@demo.com  /  Demo@1234"
echo "  To stop the app: press Ctrl+C or close this window."
echo "============================================================"

# 4. Open browser once the server is up (works on macOS `open` and Linux `xdg-open`)
open_browser() {
  if command -v open >/dev/null 2>&1; then open http://localhost:3000
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:3000
  else echo "Open your browser to http://localhost:3000"; fi
}
( sleep 9 && open_browser ) &

# 5. Start the server
npm run dev:local
