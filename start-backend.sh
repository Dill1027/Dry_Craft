#!/bin/bash

echo "🚀 Starting backend server..."

cd backend

# Check if target directory exists (compiled)
if [ ! -d "target" ]; then
    echo "📦 Building backend for the first time..."
    mvn clean package -DskipTests
fi

echo "🏃‍♂️ Running Spring Boot application..."
java -jar target/backend-0.0.1-SNAPSHOT.jar
