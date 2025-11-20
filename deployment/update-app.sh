#!/bin/bash

# APAC Services Margin Analysis - Update Script
# Use this to update the application after code changes

set -e

echo "=========================================="
echo "Updating APAC Margin Analysis"
echo "=========================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Pull latest changes
echo "Pulling latest changes..."
git pull

# Update backend
echo "Updating backend..."
cd backend
npm install --production

# Update frontend
echo "Updating frontend..."
cd ../frontend
npm install
npm run build

# Restart backend
echo "Restarting backend..."
pm2 restart margin-analysis-backend

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "=========================================="
echo "✓ Update complete!"
echo "=========================================="
