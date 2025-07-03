# 🚀 Backend Deployment Guide

## Current Status
Your backend is already deployed on Azure at: `https://drycraft-gmecd2bjbxgeahfu.canadacentral-01.azurewebsites.net`

## 📋 Deployment Options

### 1. **Azure Container Apps (Recommended)**
Best for scalability and Azure ecosystem integration.

#### Prerequisites:
```bash
# Install Azure CLI
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login
```

#### Deploy:
```bash
cd backend
chmod +x deploy-azure.sh
./deploy-azure.sh
```

#### Required Environment Variables:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CORS_ALLOWED_ORIGINS`: Your Vercel frontend URL

### 2. **Railway (Easy & Fast)**
Great for quick deployments with minimal configuration.

#### Steps:
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` folder as root
4. Railway will auto-detect the Dockerfile
5. Set environment variables in Railway dashboard

#### Environment Variables:
```
SPRING_PROFILES_ACTIVE=prod
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
PORT=8080
```

### 3. **Render**
Reliable hosting with good free tier.

#### Steps:
1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Root Directory: `backend`
5. Runtime: Docker
6. Render will use the `render.yaml` configuration

### 4. **Heroku**
Traditional PaaS option.

#### Steps:
```bash
# Install Heroku CLI
# Create Heroku app
heroku create dry-craft-backend

# Set environment variables
heroku config:set SPRING_PROFILES_ACTIVE=prod
heroku config:set MONGODB_URI="your_connection_string"
heroku config:set JWT_SECRET="your_secret"
heroku config:set CORS_ALLOWED_ORIGINS="https://your-vercel-app.vercel.app"

# Deploy
git subtree push --prefix backend heroku main
```

## 🔧 Configuration Files Created

### `application-prod.properties`
- Production-ready Spring Boot configuration
- Environment variable support
- Optimized for cloud deployment

### `Dockerfile`
- Multi-stage build for smaller image size
- OpenJDK 17 base image
- Production optimizations

### `deploy-azure.sh`
- Automated Azure Container Apps deployment
- Creates all necessary Azure resources
- Configures networking and scaling

### `railway.json`
- Railway platform configuration
- Health checks and restart policies

### `render.yaml`
- Render platform configuration
- Docker-based deployment

## 📝 Post-Deployment Steps

1. **Update CORS Origins**
   After deploying frontend to Vercel, update the backend environment variable:
   ```
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://localhost:3000
   ```

2. **Update Frontend Environment**
   Update your frontend `.env.production` with the new backend URL:
   ```
   REACT_APP_API_URL=https://your-new-backend-url.com
   REACT_APP_MEDIA_URL=https://your-new-backend-url.com/api/media
   ```

3. **Test the Connection**
   Verify your frontend can communicate with the backend by checking:
   - Login/Registration
   - File uploads
   - API endpoints

## 🛡️ Security Considerations

- ✅ Production properties hide error details
- ✅ JWT secret from environment variable
- ✅ CORS configured for specific origins
- ✅ MongoDB URI from environment variable
- ✅ Reduced logging in production

## 📊 Monitoring

Add these endpoints for monitoring:
- Health: `/actuator/health`
- Info: `/actuator/info`

## 🔄 CI/CD

For automated deployments, set up GitHub Actions to deploy on push to main branch.

---

Choose the deployment option that best fits your needs. Railway and Render are the easiest for quick setup, while Azure Container Apps offers the most scalability and integration with your existing Azure resources.
