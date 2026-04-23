#!/bin/bash

# Block3RChain - macOS/Linux Installation Script
# This script installs all necessary dependencies and sets up the database.

set -e

echo "Starting Block3RChain Installation..."

# 1. Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install it from https://www.python.org/downloads/"
    exit 1
fi

# 2. Check for Node.js
if ! command -v npm &> /dev/null; then
    echo "Node.js/NPM is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# 3. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed or not in PATH. Please install Docker Desktop for macOS."
else
    echo "Starting PostgreSQL Database via Docker..."
    # Move to root to find docker-compose.yml
    cd "$(dirname "$0")/.."
    docker-compose up -d
fi

echo "Setting up Python Virtual Environment..."
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

python3 -m venv "$BACKEND_DIR/venv"
source "$BACKEND_DIR/venv/bin/activate"

echo "Installing Backend dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "Installing Frontend dependencies..."
cd "$FRONTEND_DIR" && npm install

echo ""
echo "Installation complete!"
echo "You can now start the simulation using: ./run.sh"
