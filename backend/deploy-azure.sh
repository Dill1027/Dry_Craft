#!/bin/bash

# Azure Container Apps deployment script for Dry Craft Backend

# Variables
RESOURCE_GROUP="dry-craft-rg"
LOCATION="canadacentral"
CONTAINER_APP_ENV="dry-craft-env"
CONTAINER_APP_NAME="dry-craft-backend"
ACR_NAME="drycraftregistry"

echo "🚀 Starting Azure Container Apps deployment..."

# Step 1: Create Resource Group (if it doesn't exist)
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 2: Create Azure Container Registry (if it doesn't exist)
echo "🏗️ Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Step 3: Build and push Docker image
echo "🔨 Building and pushing Docker image..."
az acr build --registry $ACR_NAME --image dry-craft-backend:latest .

# Step 4: Create Container Apps Environment
echo "🌍 Creating Container Apps environment..."
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Step 5: Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)

# Step 6: Create Container App
echo "📱 Creating Container App..."
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image $ACR_LOGIN_SERVER/dry-craft-backend:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv) \
  --target-port 8080 \
  --ingress external \
  --env-vars \
    SPRING_PROFILES_ACTIVE=prod \
    MONGODB_URI="$MONGODB_URI" \
    JWT_SECRET="$JWT_SECRET" \
    CORS_ALLOWED_ORIGINS="$CORS_ALLOWED_ORIGINS" \
  --cpu 1.0 \
  --memory 2Gi \
  --min-replicas 1 \
  --max-replicas 3

# Get the app URL
echo "🎉 Deployment complete!"
FQDN=$(az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)
echo "Your backend is available at: https://$FQDN"

echo "📝 Don't forget to:"
echo "1. Set environment variables in Azure Portal"
echo "2. Update CORS_ALLOWED_ORIGINS with your Vercel frontend URL"
echo "3. Update your frontend .env with the new backend URL"
