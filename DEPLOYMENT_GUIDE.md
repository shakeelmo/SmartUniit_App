# 🚀 VPS Deployment Guide

## VPS Details
- **IP Address**: 109.199.116.107
- **Username**: root
- **Password**: X9mK4LpZq7GtV2Fb
- **Domain**: work.smartuniit.com

## 📋 Step-by-Step Deployment

### Step 1: Connect to Your VPS
```bash
ssh root@109.199.116.107
# Enter password: X9mK4LpZq7GtV2Fb
```

### Step 2: Update System
```bash
apt update -y
apt upgrade -y
```

### Step 3: Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version
npm --version
```

### Step 4: Install PM2
```bash
npm install -g pm2
pm2 --version
```

### Step 5: Install Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Step 6: Install Git
```bash
apt install -y git
```

### Step 7: Deploy Application
```bash
cd /var/www

# Clone or update project
if [ -d 'smartuniit-taskflow' ]; then
    cd smartuniit-taskflow
    git pull origin main
else
    git clone https://github.com/shakeelmo/-boltAPPworkmgmt_V1.1.git smartuniit-taskflow
    cd smartuniit-taskflow
fi
```

### Step 8: Install Dependencies & Build
```bash
# Install frontend dependencies
npm install

# Build the frontend
npm run build

# Install backend dependencies
cd server && npm install && cd ..
```

### Step 9: Setup Database
```bash
cd server

# Create database file if not exists
if [ ! -f "database.sqlite" ]; then
    touch database.sqlite
fi

# Initialize database
node initDatabase.js

# Create admin user
node createAdmin.js

cd ..
```

### Step 10: Configure PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
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
EOF

# Start with PM2
pm2 delete smartuniit-taskflow-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 11: Configure Nginx
```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/work.smartuniit.com << 'EOF'
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
        proxy_read_timeout 86400;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/work.smartuniit.com /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 12: Final Verification
```bash
# Check PM2 status
pm2 status

# Check if backend is responding
curl -s http://localhost:3001/api/auth/login

# Check Nginx status
systemctl status nginx

# Test domain access
curl -s -I http://work.smartuniit.com
```

## 🎯 Deployment Complete!

### Access Information
- **Frontend**: http://work.smartuniit.com
- **Backend API**: http://work.smartuniit.com/api
- **Login**: admin@example.com / admin123

### Useful Commands
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs smartuniit-taskflow-backend

# Restart app
pm2 restart smartuniit-taskflow-backend

# Check Nginx
systemctl status nginx

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Troubleshooting
If you encounter issues:
1. Check PM2 logs: `pm2 logs smartuniit-taskflow-backend`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Restart services: `pm2 restart smartuniit-taskflow-backend && systemctl reload nginx`
4. Verify database: Check if `server/database.sqlite` exists and has data

## 🚀 Ready to Deploy!

Follow these steps in order on your VPS. The deployment should take approximately 10-15 minutes.

