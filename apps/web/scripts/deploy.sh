#!/bin/bash

# Exit on any error
set -e

# Configuration
EC2_HOST="your-ec2-host"
EC2_USER="ec2-user"
REMOTE_DIR="/path/to/app"
SSH_KEY_PATH="~/.ssh/your-key.pem"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

NEXT_PUBLIC_SUPABASE_URL=https://ppnulxweiiczciuxcypn.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbnVseHdlaWljemNpdXhjeXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzg3NDAsImV4cCI6MjA1ODYxNDc0MH0.qFMUbh8JFO-lyiWTp-9EXG4lKwPR5Gy4nmGEzfX3CNA \
NODE_ENV=production

echo -e "${GREEN}Starting deployment process...${NC}"

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# Ensure we're on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    echo "Switching to main branch..."
    git checkout main || handle_error "Failed to switch to main branch"
fi

# Pull latest changes
echo "Pulling latest changes from main..."
git pull origin main || handle_error "Failed to pull latest changes"

# Build the application
echo "Building the application..."
pnpm build || handle_error "Build failed"

# Create a temporary directory for the build
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy standalone build and static assets
cp -r .next/standalone/* "$TEMP_DIR/" || handle_error "Failed to copy standalone build"
cp -r .next/static "$TEMP_DIR/.next/" || handle_error "Failed to copy static assets"
cp -r public "$TEMP_DIR/" || handle_error "Failed to copy public assets"

# Sync to EC2
echo "Syncing to EC2..."
rsync -avz --delete -e "ssh -i $SSH_KEY_PATH" \
    "$TEMP_DIR/" \
    "$EC2_USER@$EC2_HOST:$REMOTE_DIR" || handle_error "Failed to sync to EC2"

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# Restart the application on EC2
echo "Restarting the application on EC2..."
ssh -i "$SSH_KEY_PATH" "$EC2_USER@$EC2_HOST" "cd $REMOTE_DIR && pm2 restart all" || handle_error "Failed to restart application"

echo -e "${GREEN}Deployment completed successfully!${NC}" 