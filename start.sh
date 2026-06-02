#!/bin/bash

# Quantum Spark Bot - Startup Script
# This script starts the HTTP server for the trading platform

echo "========================================"
echo "  Quantum Spark Bot™ - Starting...  "
echo "========================================"

# Change to app directory
cd "$(cd "$(dirname "$0")" && pwd)"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    exit 1
fi

echo "✓ Python 3 found"

# Check if required files exist
if [ ! -f "index.html" ]; then
    echo "ERROR: index.html not found"
    exit 1
fi

if [ ! -d "js" ]; then
    echo "ERROR: js/ directory not found"
    exit 1
fi

echo "✓ Required files found"
echo "✓ Starting HTTP server on port ${PORT:-8080}..."
echo ""

# Start the server
python3 server.py
