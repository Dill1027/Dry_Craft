#!/bin/bash

echo "🚀 Starting Dry Craft Local Development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17+ first."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven first."
    exit 1
fi

echo "✅ All dependencies are installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🎯 Setup complete!"
echo ""
echo "To start development:"
echo "1. Start the backend: ./start-backend.sh"
echo "2. Start the frontend: ./start-frontend.sh"
echo ""
echo "Or run both with: ./start-dev.sh"
