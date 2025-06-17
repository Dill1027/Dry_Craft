# Dry Craft

A modern social media platform built with React, Spring Boot, and MongoDB, featuring realtime interactions and rich media support.

![App Screenshot](./docs/images/hero.png)

## ✨ Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Secure password hashing with BCrypt

- **Social Interactions**
  - Create, edit, and delete posts
  - Like and comment on posts
  - User profiles with customizable avatars
  - Real-time comment updates

- **Media Support**
  - Multi-image upload support
  - Video upload with streaming
  - Adaptive media loading
  - Chunked file transfer

- **UI/UX**
  - Responsive Material Design
  - Smooth animations and transitions
  - Dark/Light theme support
  - Loading states and error handling
  - Progressive image loading

## 🚀 Tech Stack

### Frontend
- React 18
- Material UI 5
- TailwindCSS 3
- Axios
- React Router 6

### Backend
- Spring Boot 3.x
- MongoDB 6.x
- GridFS for media storage
- Spring Security with JWT
- OpenAPI/Swagger

## 🛠️ Installation

### Prerequisites
- Node.js (>= 16.0.0)
- Java JDK (>= 17)
- MongoDB (>= 6.0)
- Maven (>= 3.8)

### Setup Development Environment

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/Dry_Craft.git
cd Dry_Craft
```

2. **Backend Setup**
```bash
cd backend
mvn clean install
# Create application-dev.properties with your config
mvn spring-boot:run -Dspring.profiles.active=dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
# Create .env file with your config
npm start
```

### Environment Variables

Frontend (.env):
```plaintext
# Development environment
REACT_APP_API_URL=http://localhost:8081
REACT_APP_MEDIA_URL=http://localhost:8081/api/media
REACT_APP_MAX_FILE_SIZE=15728640

# Production environment (Azure)
# These are automatically set in netlify.toml for frontend deployment
# REACT_APP_API_URL=https://drycraft-gmecd2bjbxgeahfu.canadacentral-01.azurewebsites.net
# REACT_APP_MEDIA_URL=https://drycraft-gmecd2bjbxgeahfu.canadacentral-01.azurewebsites.net/api/media
```

Backend (application.properties):
```plaintext
# Development environment
spring.data.mongodb.uri=mongodb://localhost:27017/drycraft
spring.servlet.multipart.max-file-size=15MB
jwt.secret=your_jwt_secret_key
upload.directory=/path/to/uploads

# Production environment (Azure)
# spring.data.mongodb.uri=${MONGODB_CONNECTION_STRING}
# spring.servlet.multipart.max-file-size=15MB
# jwt.secret=${JWT_SECRET}
# upload.directory=${UPLOAD_DIR}
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test               # Run unit tests
npm run test:coverage  # Run tests with coverage
npm run test:e2e      # Run end-to-end tests
```

### Backend Tests
```bash
cd backend
mvn test              # Run unit tests
mvn verify            # Run integration tests
```

## 📦 Deployment

### Azure Deployment
The application is deployed at:
- Backend API: https://drycraft-gmecd2bjbxgeahfu.canadacentral-01.azurewebsites.net
- Frontend: Hosted on Netlify (linked to the Azure backend)

To deploy updates:
1. Push changes to the main branch, which will trigger the GitHub Actions workflow
2. The workflow will build and deploy the backend to Azure
3. Frontend will be automatically deployed through Netlify

### Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

### Manual Deployment
1. Build frontend:
```bash
cd frontend
npm run build
```

2. Build backend:
```bash
cd backend
mvn package
```

3. Deploy the generated JAR file:
```bash
java -jar target/drycraft-0.0.1-SNAPSHOT.jar
```

## 📚 API Documentation

Access the API documentation at:
- Swagger UI: `https://drycraft-gmecd2bjbxgeahfu.canadacentral-01.azurewebsites.net/swagger-ui.html`
- OpenAPI Spec: `https://drycraft-gmecd2bjbxgeahfu.canadacentral-01.azurewebsites.net/v3/api-docs`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch:
```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes:
```bash
git commit -m 'Add some AmazingFeature'
```

4. Push to the branch:
```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

### Coding Standards
- Follow Google Java Style Guide for backend
- Use Prettier for frontend code formatting
- Write meaningful commit messages
- Maintain test coverage above 80%

## 🔐 Security

- All endpoints are secured with JWT authentication
- Password hashing using BCrypt
- CORS configuration
- Rate limiting implemented
- Input validation and sanitization
- Regular dependency updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material UI for the component library
- Spring Boot team for the amazing framework
- MongoDB team for the database
- All contributors who have helped this project grow

## 📞 Support

For support, email support@drycraft.com or join our Slack channel.
