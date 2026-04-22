#!/bin/bash

# Block3RChain - macOS/Linux Installation Script
# This script installs all necessary dependencies for both backend and frontend.

set -e

echo "🚀 Starting Block3RChain Installation..."

# 1. Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install it from https://www.python.org/downloads/"
    exit 1
fi

# 2. Check for Node.js
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/NPM is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "📦 Setting up Python Virtual Environment..."
BACKEND_DIR=""
if [ -d "../backend" ]; then
    BACKEND_DIR="../backend"
else
    BACKEND_DIR="backend"
fi

python3 -m venv "$BACKEND_DIR/venv"
source "$BACKEND_DIR/venv/bin/activate"

echo "📦 Installing Backend dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "📦 Installing Frontend dependencies..."
if [ -d "../frontend" ]; then
    cd ../frontend && npm install
else
    cd frontend && npm install
fi

echo ""
echo "✅ Installation complete!"
echo "You can now start the simulation using: ./run.sh"
