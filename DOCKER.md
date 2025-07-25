# Docker Setup for TAMS Frontend

This guide explains how to use Docker to run the TAMS frontend application.

## 🐳 **Docker Architecture Overview**

### **Multi-Stage Build Process**
Our Docker setup uses a **multi-stage build** approach:

1. **Build Stage**: Compiles React app into static files
2. **Production Stage**: Serves static files with nginx

This creates a smaller, more secure production image.

### **Key Components**

- **`Dockerfile`**: Multi-stage production build
- **`Dockerfile.dev`**: Development environment with hot reloading
- **`nginx.conf`**: Optimized web server configuration
- **`docker-compose.yml`**: Container orchestration
- **`.dockerignore`**: Excludes unnecessary files from build

## 🚀 **Quick Start**

### **Production Build**
```bash
# Build and run production container
docker-compose up --build

# Access the application
open http://localhost:3000
```

### **Development Mode**
```bash
# Run in development mode with hot reloading
docker-compose --profile dev up --build

# Access the development server
open http://localhost:5173
```

## 📋 **Step-by-Step Explanation**

### **1. Building the Production Image**

```bash
# Build the Docker image
docker build -t tams-frontend .

# What happens during the build:
# 1. Uses node:18-alpine as base image (lightweight)
# 2. Copies package.json and installs dependencies
# 3. Copies source code
# 4. Runs npm run build to create optimized static files
# 5. Switches to nginx:alpine for serving
# 6. Copies built files to nginx's serve directory
```

### **2. Running the Container**

```bash
# Run the container
docker run -p 3000:80 tams-frontend

# What this does:
# - Maps port 3000 on your machine to port 80 in container
# - Starts nginx serving the built React app
# - Container runs in foreground
```

### **3. Using Docker Compose**

```bash
# Start production service
docker-compose up

# Start development service
docker-compose --profile dev up

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

## 🔧 **Configuration Options**

### **Environment Variables**
```yaml
# In docker-compose.yml
environment:
  - NODE_ENV=production
  - VITE_API_URL=http://localhost:8000
```

### **Port Mapping**
```yaml
# Change the host port if needed
ports:
  - "8080:80"  # Maps host port 8080 to container port 80
```

### **Resource Limits**
```yaml
# Limit container resources
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## 🛠️ **Development Workflow**

### **Local Development with Docker**
```bash
# Start development container
docker-compose --profile dev up

# Make changes to your code
# Changes are automatically reflected due to volume mounting

# View logs
docker-compose logs -f frontend-dev
```

### **Building for Production**
```bash
# Build production image
docker build -t tams-frontend:latest .

# Tag for registry
docker tag tams-frontend:latest your-registry/tams-frontend:latest

# Push to registry
docker push your-registry/tams-frontend:latest
```

## 📊 **Performance Optimizations**

### **Image Size Optimization**
- **Multi-stage build**: Reduces final image size by ~90%
- **Alpine Linux**: Lightweight base images
- **Layer caching**: Optimized Docker layer ordering
- **`.dockerignore`**: Excludes unnecessary files

### **Runtime Optimizations**
- **Nginx**: High-performance web server
- **Gzip compression**: Reduces bandwidth usage
- **Caching headers**: Optimizes static asset delivery
- **Security headers**: Protects against common attacks

## 🔍 **Troubleshooting**

### **Common Issues**

**Container won't start**
```bash
# Check logs
docker-compose logs frontend

# Check if port is in use
lsof -i :3000
```

**Build fails**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t tams-frontend .
```

**Development hot reload not working**
```bash
# Check volume mounting
docker-compose exec frontend-dev ls -la /app

# Restart development container
docker-compose restart frontend-dev
```

### **Useful Commands**

```bash
# View running containers
docker ps

# View container logs
docker logs tams-frontend

# Execute commands in container
docker exec -it tams-frontend sh

# View image layers
docker history tams-frontend

# Check image size
docker images tams-frontend
```

## 🚀 **Deployment Options**

### **Single Container**
```bash
# Build and run
docker build -t tams-frontend .
docker run -d -p 3000:80 tams-frontend
```

### **Docker Compose**
```bash
# Production deployment
docker-compose up -d

# With custom environment
docker-compose -f docker-compose.prod.yml up -d
```

### **Kubernetes**
```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tams-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tams-frontend
  template:
    metadata:
      labels:
        app: tams-frontend
    spec:
      containers:
      - name: frontend
        image: tams-frontend:latest
        ports:
        - containerPort: 80
```

## 📈 **Monitoring and Health Checks**

### **Health Check Endpoint**
The nginx configuration includes a health check endpoint:
```bash
# Test health check
curl http://localhost:3000/health
# Returns: "healthy"
```

### **Logging**
```bash
# View nginx access logs
docker exec tams-frontend tail -f /var/log/nginx/access.log

# View nginx error logs
docker exec tams-frontend tail -f /var/log/nginx/error.log
```

## 🔒 **Security Considerations**

### **Container Security**
- **Non-root user**: nginx runs as non-root
- **Security headers**: XSS protection, content type sniffing prevention
- **Minimal attack surface**: Only nginx and static files
- **Regular updates**: Base images updated regularly

### **Network Security**
- **Port exposure**: Only necessary ports exposed
- **Internal networking**: Services communicate via Docker networks
- **Reverse proxy**: Can be placed behind nginx/HAProxy

## 📚 **Learning Resources**

- [Docker Documentation](https://docs.docker.com/)
- [Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/multistage-build/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Docker Compose](https://docs.docker.com/compose/)

---

**Happy Containerizing! 🐳** 