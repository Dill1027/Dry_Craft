#!/bin/bash

echo "🚀 Starting Dry Craft Development Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "🏗️  Starting backend server..."
cd backend
if [ ! -d "target" ]; then
    echo "📦 Building backend..."
    mvn clean package -DskipTests
fi
java -jar target/backend-0.0.1-SNAPSHOT.jar &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 5

# Start frontend in background  
echo "🎨 Starting frontend server..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Both services started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait
