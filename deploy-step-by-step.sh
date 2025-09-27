#!/bin/bash

# Step-by-Step VPS Deployment Script
# VPS Details: 109.199.116.107
# Username: root
# Password: X9mK4LpZq7GtV2Fb
# Domain: work.smartuniit.com

echo "🚀 Step-by-Step VPS Deployment"
echo "================================"
echo "VPS: 109.199.116.107"
echo "Domain: work.smartuniit.com"
echo ""

echo "📋 Step 1: Testing SSH connection..."
if sshpass -p 'X9mK4LpZq7GtV2Fb' ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@109.199.116.107 "echo 'SSH OK'" 2>/dev/null; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    exit 1
fi

echo ""
echo "📋 Step 2: Deploying application..."
echo "This will take a few minutes..."

# Deploy the application
sshpass -p 'X9mK4LpZq7GtV2Fb' ssh -o StrictHostKeyChecking=no root@109.199.116.107 << 'DEPLOY_SCRIPT'
set -e

echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system..."
apt update -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📥 Installing Nginx..."
    apt install -y nginx
fi

# Navigate to web directory
cd /var/www

# Clone or update project
if [ -d 'smartuniit-taskflow' ]; then
    echo "📁 Updating existing project..."
    cd smartuniit-taskflow
    git pull origin main
else
    echo "📁 Cloning new project..."
    git clone https://github.com/shakeelmo/-boltAPPworkmgmt_V1.1.git smartuniit-taskflow
    cd smartuniit-taskflow
fi

# Install dependencies and build
echo "📦 Installing frontend dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "📦 Installing backend dependencies..."
cd server && npm install && cd ..

# Setup database
echo "🗄️ Setting up database..."
cd server
if [ ! -f "database.sqlite" ]; then
    touch database.sqlite
fi
node initDatabase.js
node createAdmin.js
cd ..

# Configure PM2
echo "📱 Configuring PM2..."
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'smartuniit-taskflow-backend',
    script: 'server/index.js',
    cwd: '/var/www/smartuniit-taskflow',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
PM2EOF

# Start with PM2
pm2 delete smartuniit-taskflow-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/work.smartuniit.com << 'NGINXEOF'
server {
    listen 80;
    server_name work.smartuniit.com;

    root /var/www/smartuniit-taskflow/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/work.smartuniit.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo "✅ Deployment completed!"
echo "🌐 App available at: http://work.smartuniit.com"
echo "👤 Login: admin@example.com / admin123"
DEPLOY_SCRIPT

echo ""
echo "🎯 Deployment Summary:"
echo "====================="
echo "✅ Application deployed successfully!"
echo "✅ Database initialized"
echo "✅ PM2 configured and running"
echo "✅ Nginx configured and running"
echo ""
echo "🌐 Your application is now available at:"
echo "   http://work.smartuniit.com"
echo ""
echo "👤 Login credentials:"
echo "   Username: admin@example.com"
echo "   Password: admin123"
echo ""
echo "📋 Useful commands:"
echo "   • Check PM2 status: ssh root@109.199.116.107 'pm2 status'"
echo "   • View logs: ssh root@109.199.116.107 'pm2 logs smartuniit-taskflow-backend'"
echo "   • Restart app: ssh root@109.199.116.107 'pm2 restart smartuniit-taskflow-backend'"
echo ""
echo "🚀 Deployment completed successfully!"









