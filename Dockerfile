# Multi-stage Dockerfile for TAMS Frontend
# This approach creates a smaller production image by using separate stages for building and serving

# Stage 1: Build Stage
# This stage compiles the React application into static files
FROM node:18-alpine AS builder

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

# Install gettext for envsubst (used for environment variable substitution)
# Install netcat-openbsd for health checks
RUN apk add --no-cache gettext netcat-openbsd

# Copy nginx configuration template
# This will be processed by the entrypoint script to substitute environment variables
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built files from builder stage to nginx's serve directory
# The dist/ folder contains our compiled React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
# This tells Docker which port the container will listen on
EXPOSE 80

# Use entrypoint script to handle environment variable substitution
ENTRYPOINT ["/docker-entrypoint.sh"] 