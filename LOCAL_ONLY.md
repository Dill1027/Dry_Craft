# Dry Craft - Local Development Only 🏠

## ✅ CLEANED UP & READY FOR LOCAL DEVELOPMENT

**All unused deployment files and code have been removed!** This project now runs purely on your local machine.

### 🚀 Quick Start

**1. First time setup:**
```bash
./setup-local.sh
```

**2. Start development:**
```bash
./start-dev.sh
```

**3. Open in browser:**
- Frontend: http://localhost:3002
- Backend: http://localhost:8081

### 🗑️ Files Removed

**Deployment-related files cleaned up:**
- ❌ backend/.env.railway (Railway deployment config)
- ❌ backend/deploy-azure.sh (Azure deployment script)  
- ❌ backend/src/main/resources/application-prod.properties (Production config)
- ❌ backend/controllers/ and backend/models/ (Old Node.js files)
- ❌ src/ (Unused root source directory)
- ❌ PROJECT_STATUS.md and SPRING_BOOT_FIXED.md (Temporary docs)

**Code cleaned up:**
- ❌ Removed Azure/Vercel/Netlify URLs from CORS configuration
- ❌ Updated image utilities to remove Azure storage references
- ❌ Cleaned up README.md to remove deployment sections
- ❌ Updated .gitignore to remove Netlify entries

### 📁 Clean Project Structure
```
Dry_Craft/
├── frontend/              # React app
├── backend/               # Spring Boot app
├── start-dev.sh          # Start both services
├── start-frontend.sh     # Start React only
├── start-backend.sh      # Start Spring Boot only
├── setup-local.sh        # Initial setup
└── .env                  # Local config
```

### 🛠️ What Each Script Does

- **setup-local.sh** - Installs all dependencies (run once)
- **start-dev.sh** - Starts both frontend and backend together
- **start-frontend.sh** - Starts only React development server
- **start-backend.sh** - Starts only Spring Boot server

### 🔧 Manual Commands (Alternative)

```bash
# Frontend only
cd frontend && npm start

# Backend only (in another terminal)
cd backend && mvn spring-boot:run
```

### 💡 Development Workflow

1. Make code changes
2. Frontend auto-reloads on save
3. Restart backend if you change Java code
4. Database is already connected (MongoDB cloud)

### 🚫 What We DON'T Use

- ❌ No Vercel deployment
- ❌ No Netlify deployment  
- ❌ No cloud hosting
- ❌ No serverless functions
- ❌ No deployment pipelines

### ✅ What We DO Use

- ✅ Local React development server
- ✅ Local Spring Boot server
- ✅ MongoDB cloud database (already configured)
- ✅ Simple shell scripts for easy startup

**Everything runs locally - simple and fast! 🚀**
