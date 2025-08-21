#!/bin/bash

# One-click remote deployment to VPS

set -euo pipefail

HOST="109.199.116.107"
USER="root"
DOMAIN="work.smartuniit.com"

echo "🚀 Deploying to ${USER}@${HOST} (${DOMAIN})"

REMOTE_CMD='
set -e
cd /var/www
if [ -d "smartuniit-taskflow" ]; then
  cd smartuniit-taskflow && git pull origin main
else
  git clone https://github.com/shakeelmo/-boltAPPworkmgmt_V1.1.git smartuniit-taskflow && cd smartuniit-taskflow
fi

echo "📦 Installing frontend deps..." && npm install
echo "🔨 Building frontend..." && npm run build
echo "📦 Installing backend deps..." && cd server && npm install && cd ..

echo "🔁 Restarting PM2..." && (pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js)
pm2 save

echo "🔁 Reloading Nginx..." && systemctl reload nginx

echo "✅ Remote deployment steps completed."
'

ssh "${USER}@${HOST}" "${REMOTE_CMD}"

echo "🌐 Verifying public endpoints..."
curl -s -I "https://${DOMAIN}" | head -5 || true
echo "API health:" && curl -s "https://${DOMAIN}/api/health" || true

echo "✅ Deployment finished. Visit: https://${DOMAIN}"


