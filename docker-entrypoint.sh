#!/bin/sh
# Docker entrypoint script for TAMS Frontend
# This script substitutes environment variables in nginx.conf

set -e

# Default backend URL (monks_tams_api on localhost:3000)
BACKEND_URL=${BACKEND_URL:-http://host.docker.internal:3000}

# For Linux Docker, use the host's IP if host.docker.internal doesn't work
# You can set BACKEND_URL environment variable in docker-compose.yml
# Example: BACKEND_URL=http://172.17.0.1:3000

# Use envsubst to replace BACKEND_URL in nginx.conf
# Create a temporary nginx config with substituted values
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g 'daemon off;'

