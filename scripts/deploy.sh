#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Dancing Dead Records - O2Switch Deployment
# ============================================
#
# Usage:
#   ./scripts/deploy.sh <ssh-user> <ssh-host>
#
# Example:
#   ./scripts/deploy.sh dancingdead ssh.dancingdeadrecords.com
#
# Prerequisites:
#   - SSH key configured for the remote host
#   - Node.js >= 18 installed on O2Switch
#   - PM2 installed globally on the server (npm i -g pm2)

SSH_USER="${1:?Usage: deploy.sh <ssh-user> <ssh-host>}"
SSH_HOST="${2:?Usage: deploy.sh <ssh-user> <ssh-host>}"
REMOTE_DIR="~/dancing-dead-mcp"
APP_NAME="dancing-dead-mcp"

echo "=== Dancing Dead Records - Deploy ==="
echo "Target: ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
echo ""

# 1. Build locally
echo "[1/4] Building project..."
npm run build

# 2. Sync files via rsync
echo "[2/4] Syncing files to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.idea' \
  ./ "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

# 3. Install dependencies on server
echo "[3/4] Installing dependencies on server..."
ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && npm ci --production"

# 4. Restart with PM2
echo "[4/4] Restarting application with PM2..."
ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && pm2 delete ${APP_NAME} 2>/dev/null || true && pm2 start dist/server.js --name ${APP_NAME} && pm2 save"

echo ""
echo "=== Deployment complete ==="
echo "Check status: ssh ${SSH_USER}@${SSH_HOST} 'pm2 status ${APP_NAME}'"
echo "View logs:    ssh ${SSH_USER}@${SSH_HOST} 'pm2 logs ${APP_NAME}'"
