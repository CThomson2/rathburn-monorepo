name: Deploy to EC2

on:
push:
branches: [main]
paths: - "apps/rathburn-app/\*\*" - ".github/workflows/deploy.yml"
workflow_dispatch: # Allows the workflow to be manually triggered from the GitHub Actions tab

jobs:
deploy:
runs-on: ubuntu-latest
env:
AWS_INSTANCE_SG_ID: ${{ secrets.AWS_INSTANCE_SG_ID }}
NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
SUPABASE_JWT_SECRET: ${{ secrets.SUPABASE_JWT_SECRET }}
SMTP_API_KEY: ${{ secrets.SMTP_API_KEY }}
steps: # Set up repository and environment - name: Checkout repository
uses: actions/checkout@v4
with:
fetch-depth: 0 # Full history for monorepo

      # Set up Node.js and PNPM
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18.20"

      - name: Setup PNPM
        uses: pnpm/action-setup@v3
        with:
          version: 9.0.0

      # Install dependencies
      - name: Install dependencies
        run: pnpm install --no-frozen-lockfile

      # Build the rathburn-app
      - name: Build application
        run: pnpm build --filter rathburn-app
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ vars.TURBO_TEAM }}

      # Prepare standalone app
      - name: Prepare standalone build
        working-directory: ./apps/rathburn-app
        run: |
          # Install sharp explicitly for image optimization
          pnpm install --no-save sharp

          # Ensure sharp is copied to the standalone folder
          mkdir -p .next/standalone/node_modules/sharp
          cp -r node_modules/sharp/* .next/standalone/node_modules/sharp/

          mkdir -p .next/standalone/.next/static
          cp -r .next/static/* .next/standalone/.next/static/
          [ -d "public" ] && cp -r public .next/standalone/ || echo "No public folder"

      # Configure AWS and secure SSH access
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Get GitHub runner's public IP
        id: ip
        uses: haythem/public-ip@v1.3

      - name: Whitelist GitHub runner's IP in EC2 security group
        run: |
          echo "Adding IP ${{ steps.ip.outputs.ipv4 }} to security group $AWS_INSTANCE_SG_ID"
          aws ec2 authorize-security-group-ingress \
            --group-id $AWS_INSTANCE_SG_ID \
            --protocol tcp \
            --port 22 \
            --cidr ${{ steps.ip.outputs.ipv4 }}/32

      # First SSH connection to set up GitHub authentication
      - name: Set up GitHub authentication on EC2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.RB_EC2_KEY }}
          port: 22
          command_timeout: "10m"
          script: |
            # Set up GitHub authentication using deploy key
            mkdir -p ~/.ssh
            echo "${{ secrets.REPO_DEPLOY_KEY }}" > ~/.ssh/git/rathburn-monorepo/github_deploy_key
            chmod 600 ~/.ssh/git/rathburn-monorepo/github_deploy_key
            ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
            ssh -T -o StrictHostKeyChecking=no git@github.com || echo "GitHub authentication configured"

            # Navigate to project directory
            cd /home/ec2-user/rathburn-online
            # Navigate to project directory
              HostName github.com
              User git
              IdentityFile ~/.ssh/git/rathburn-monorepo/github_deploy_key
              IdentitiesOnly yes
            EOF
            # Add GitHub to known hosts to avoid prompts
            ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
            # Test GitHub SSH connection
            ssh -T -o StrictHostKeyChecking=no git@github.com || echo "GitHub authentication configured"

      # Main deployment script
      - name: Deploy application to EC2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.RB_EC2_KEY }}
          port: 22
          command_timeout: "20m"
          script: |
            # Navigate to project directory
            cd /home/ec2-user/rathburn-online

            # Stop and delete PM2 process
            pm2 stop rathburn-online || true
            pm2 delete rathburn-online || true

            # Pull latest changes from GitHub
            git pull origin main

            # Setup pnpm
            export PATH="/home/ec2-user/.local/share/pnpm:$PATH"

            # Install dependencies
            cd /home/ec2-user/rathburn-online/apps/rathburn-app
            pnpm install --no-frozen-lockfile

            # Install sharp explicitly for image optimization
            pnpm install --no-save sharp

            # Build application
            pnpm build

            # Ensure sharp is copied to the standalone folder
            mkdir -p .next/standalone/node_modules/sharp
            cp -r node_modules/sharp/* .next/standalone/node_modules/sharp/

            # Copy environment and static files
            cp .env .next/standalone/
            mkdir -p .next/standalone/.next/static

            # Copy static files
            cp -r .next/static/* .next/standalone/.next/static/

            # Copy public folder to the correct location
            [ -d "public" ] && cp -r public .next/standalone/public || echo "No public folder"

            # Ensure environment variables are available to the standalone server
            cp .env .next/standalone/.env

            # Start application with PM2
            pm2 start ecosystem.config.js
            pm2 save

      # Clean up - revoke temporary security group rule
      - name: Revoke temporary IP access
        if: always() # Run even if previous steps failed
        run: |
          echo "Removing IP ${{ steps.ip.outputs.ipv4 }} from security group $AWS_INSTANCE_SG_ID"
          aws ec2 revoke-security-group-ingress \
            --group-id $AWS_INSTANCE_SG_ID \
            --protocol tcp \
            --port 22 \
            --cidr ${{ steps.ip.outputs.ipv4 }}/32
