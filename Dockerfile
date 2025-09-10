# Multi-stage Dockerfile for TAMS Frontend
# This approach creates a smaller production image by using separate stages for building and serving

# Stage 1: Build Stage
# This stage compiles the React application into static files
FROM node:20-alpine AS builder

# Set working directory in the container
WORKDIR /app

# Copy package files first (for better Docker layer caching)
# This allows Docker to cache the node_modules layer if package.json hasn't changed
COPY package*.json ./

# Install dependencies
# Install all dependencies (including dev dependencies) needed for build
RUN npm ci

# Copy source code
COPY . .

# Build the application
# This creates optimized static files in the dist/ directory
RUN npm run build

# Stage 2: Production Stage
# This stage serves the built static files using nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
# This replaces the default nginx config with our optimized one
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder stage to nginx's serve directory
# The dist/ folder contains our compiled React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
# This tells Docker which port the container will listen on
EXPOSE 80

# Start nginx
# This runs nginx in the foreground so Docker can manage the process
CMD ["nginx", "-g", "daemon off;"] 