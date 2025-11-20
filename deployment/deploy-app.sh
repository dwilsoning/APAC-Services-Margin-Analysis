#!/bin/bash

# APAC Services Margin Analysis - Application Deployment Script
# Run this after setup-ec2.sh

set -e

echo "=========================================="
echo "Deploying APAC Margin Analysis"
echo "=========================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Backend setup
echo "Setting up backend..."
cd backend

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit backend/.env and set production values!"
    read -p "Press enter to continue after editing .env file..."
fi

# Install backend dependencies
echo "Installing backend dependencies..."
npm install --production

# Initialize database
echo "Initializing database..."
npm run init-db

# Create admin user
echo "Creating admin user..."
echo "You will be prompted to enter admin credentials..."
npm run create-admin

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building frontend for production..."
npm run build

# Configure PM2
echo "Configuring PM2..."
cd "$PROJECT_ROOT"
pm2 delete margin-analysis-backend 2>/dev/null || true
pm2 start backend/server.js --name margin-analysis-backend
pm2 save
pm2 startup

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/margin-analysis > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root $PROJECT_ROOT/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/margin-analysis /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "=========================================="
echo "✓ Deployment complete!"
echo "=========================================="
echo "Backend running on PM2: pm2 status"
echo "Frontend served by Nginx"
echo "Access your application at: http://YOUR_EC2_PUBLIC_IP"
echo "=========================================="
