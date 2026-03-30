#!/bin/bash
set -e

# Cutline Server Deployment Script
# Run on the server to deploy/update the application

APP_DIR="/opt/cutline"
CLIENT_DIR="$APP_DIR/app/client"
SERVER_DIR="$APP_DIR/app/server"
PORT=3600

echo "Deploying Cutline..."

# Pull latest code
cd "$APP_DIR"
git pull origin main

# Install and build frontend
echo "Building frontend..."
cd "$CLIENT_DIR"
npm ci
npm run build

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$SERVER_DIR"
bun install

# Restart PM2 process
echo "Restarting backend..."
pm2 restart cutline-api 2>/dev/null || PORT=$PORT pm2 start src/index.ts --name cutline-api
pm2 save

# Reload NGINX
echo "Reloading NGINX..."
sudo systemctl reload nginx

echo "Deployment complete!"
pm2 status | grep cutline
