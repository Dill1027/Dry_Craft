#!/bin/bash

echo "🚀 Starting frontend development server..."

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🏃‍♂️ Starting React development server..."
npm start
