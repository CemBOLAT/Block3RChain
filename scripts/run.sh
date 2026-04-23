#!/bin/bash

# Block3RChain - macOS Startup Script
# This script opens 3 tabs in the default macOS Terminal:
# 1. Database Seed + FastAPI Backend (Port 8000)
# 2. Miner Nodes (Python emulator)
# 3. Next.js Frontend (Port 3000)

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "Ensuring Database is running..."
docker-compose up -d

echo "Launching Block3RChain in Terminal tabs..."

osascript <<EOF
tell application "Terminal"
    activate
    
    # Tab 1: Database Seed & FastAPI Backend
    set backendWindow to do script "cd '$PROJECT_ROOT/backend' && source venv/bin/activate && echo 'Seeding database if needed...' && python3 scripts/seed_db.py && echo 'Starting API...' && uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
    set custom title of backendWindow to "FastAPI Backend"
    
    delay 1
    
    # Tab 2: Miner Nodes
    tell application "System Events" to keystroke "t" using command down
    delay 1
    do script "cd '$PROJECT_ROOT/backend' && echo 'Waiting for API to start...' && source venv/bin/activate && sleep 5 && python3 -m emulator.nodes" in front window
    
    delay 1

    # Tab 3: Frontend Dashboard
    tell application "System Events" to keystroke "t" using command down
    delay 1
    do script "cd '$PROJECT_ROOT/frontend' && npm run dev" in front window
    
end tell
EOF

echo "Processes triggered. Check your Terminal app!"
