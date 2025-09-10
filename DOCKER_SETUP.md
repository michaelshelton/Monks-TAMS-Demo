# Docker Setup Guide for TAMS Explorer

This guide will help you run the TAMS Explorer using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- TAMS API running on `localhost:3000`
- Optional: Webcam capture script running (for live webcam feed)

## Quick Start

### Option 1: Production Mode (Recommended)

Run the optimized production build with nginx:

```bash
# Navigate to the project directory
cd /Users/thiagovic/Desktop/fromScratch/Monks-TAMS-Demo

# Build and run with Docker Compose
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

The app will be available at: **http://localhost:8080**

### Option 2: Development Mode (Hot Reload)

Run with live code reloading for development:

```bash
# Run development mode with profile
docker-compose --profile dev up tams-explorer-dev

# Or build first if needed
docker-compose --profile dev up --build tams-explorer-dev
```

The app will be available at: **http://localhost:5173**

### Option 3: Simple Docker Commands (Without Compose)

#### Production Build:
```bash
# Build the production image
docker build -t tams-explorer .

# Run the container
docker run -d \
  --name tams-explorer \
  -p 8080:80 \
  --add-host host.docker.internal:host-gateway \
  tams-explorer
```

#### Development Build:
```bash
# Build the development image
docker build -f Dockerfile.dev -t tams-explorer-dev .

# Run with volume mounting for hot reload
docker run -d \
  --name tams-explorer-dev \
  -p 5173:5173 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --add-host host.docker.internal:host-gateway \
  tams-explorer-dev
```

## Verifying the Setup

1. **Check if containers are running:**
   ```bash
   docker ps
   ```

2. **View logs:**
   ```bash
   # Production logs
   docker logs tams-explorer
   
   # Development logs
   docker logs tams-explorer-dev
   ```

3. **Test the application:**
   - Open http://localhost:8080 (production) or http://localhost:5173 (development)
   - You should see the TAMS Explorer landing page
   - Check that "API: localhost:3000" shows in the header
   - Navigate to Flows to see your video streams
   - Click on the webcam stream to view live feed (if capture script is running)

## Managing the Containers

### Stop the containers:
```bash
# Stop and remove containers
docker-compose down

# Stop specific container
docker stop tams-explorer
```

### Rebuild after code changes:
```bash
# Production (requires rebuild)
docker-compose up --build

# Development (automatic hot reload, no rebuild needed)
# Just save your files and the changes will appear
```

### Clean up:
```bash
# Remove containers and networks
docker-compose down

# Remove containers, networks, and images
docker-compose down --rmi all

# Remove specific container
docker rm tams-explorer
```

## Troubleshooting

### Cannot connect to TAMS API
- Ensure TAMS API is running on `localhost:3000`
- Check with: `curl http://localhost:3000/api/v1/flows`
- The Docker container uses `host.docker.internal` to access your host's localhost

### Port already in use
- Change the port mapping in `docker-compose.yml`
- Example: Change `"8080:80"` to `"8090:80"` for a different port

### Permission denied errors
- Run Docker commands with `sudo` if needed
- Ensure Docker daemon is running: `docker info`

### View real-time logs
```bash
# Follow logs in real-time
docker-compose logs -f tams-explorer

# Or for specific container
docker logs -f tams-explorer
```

## Configuration

The setup uses these configuration files:
- `.env` - Environment variables (already configured for local TAMS)
- `nginx.conf` - Nginx proxy configuration (routes API calls to local TAMS)
- `docker-compose.yml` - Docker Compose orchestration
- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development build with hot reload

## Next Steps

1. Access the TAMS Explorer at http://localhost:8080
2. Browse your Flows and Sources
3. View the webcam stream if capture is running
4. Monitor segments in real-time with WebSocket updates

The application is now fully configured to work with your local TAMS setup!