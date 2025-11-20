#!/bin/bash

# APAC Services Margin Analysis - EC2 Setup Script
# This script sets up the application on a fresh Ubuntu EC2 instance

set -e

echo "=========================================="
echo "APAC Margin Analysis - EC2 Setup"
echo "=========================================="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build essentials
echo "Installing build tools..."
sudo apt install -y build-essential python3

# Verify installations
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# Install nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
echo "y" | sudo ufw enable

echo "=========================================="
echo "Base setup complete!"
echo "Next steps:"
echo "1. Clone your repository"
echo "2. Run deployment/deploy-app.sh"
echo "=========================================="
