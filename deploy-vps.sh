#!/bin/bash

# VPS Deployment Script for SmartUniIT TaskFlow
# IP: 109.199.116.107
# User: root
# Password: X9mK4LpZq7GtV2Fb

set -e

echo "🚀 Starting VPS Deployment..."

# VPS Configuration
VPS_IP="109.199.116.107"
VPS_USER="root"
VPS_PASSWORD="X9mK4LpZq7GtV2Fb"
APP_DIR="/var/www/smartuniit-taskflow"

# SSH connection function
ssh_connect() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "$@"
}

# SCP function
scp_connect() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$@"
}

echo "📦 Pulling latest changes from GitHub..."
ssh_connect "cd $APP_DIR && git pull origin main"

echo "🔧 Installing/updating dependencies..."
ssh_connect "cd $APP_DIR && npm install"
ssh_connect "cd $APP_DIR/server && npm install"

echo "🏗️ Building frontend..."
ssh_connect "cd $APP_DIR && npm run build"

echo "🗄️ Setting up database schema..."
ssh_connect "cd $APP_DIR/server && node -e \"
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Create budgets table if it doesn't exist
db.run(\`
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    category TEXT,
    description TEXT,
    amount REAL,
    spent REAL DEFAULT 0,
    remaining REAL,
    status TEXT DEFAULT 'active',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
\`, (err) => {
  if (err) console.error('Error creating budgets table:', err);
  else console.log('Budgets table created/verified');
});

// Add missing columns to users table
db.run('ALTER TABLE users ADD COLUMN status TEXT DEFAULT \\'active\\'', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding status column:', err);
  }
});

db.run('ALTER TABLE users ADD COLUMN phone TEXT', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding phone column:', err);
  }
});

db.run('ALTER TABLE users ADD COLUMN department TEXT', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding department column:', err);
  }
});

db.run('ALTER TABLE users ADD COLUMN avatar_url TEXT', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding avatar_url column:', err);
  }
});

db.run('ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding updated_at column:', err);
  }
});

// Add missing columns to quotations table
db.run('ALTER TABLE quotations ADD COLUMN scope_of_work TEXT', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding scope_of_work column:', err);
  }
});

db.run('ALTER TABLE quotations ADD COLUMN scope_of_work_ar TEXT', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding scope_of_work_ar column:', err);
  }
});

db.close();
console.log('Database schema updated successfully');
\""

echo "🔄 Restarting services..."
ssh_connect "pm2 restart smartuniit-backend"
ssh_connect "systemctl reload nginx"

echo "⏳ Waiting for services to start..."
sleep 5

echo "🔍 Checking service status..."
ssh_connect "pm2 status"
ssh_connect "systemctl status nginx --no-pager"

echo "🏥 Health check..."
ssh_connect "curl -sS http://127.0.0.1:3001/api/health || echo 'Backend health check failed'"
ssh_connect "curl -sS http://work.smartuniit.com/api/health || echo 'Public health check failed'"

echo "✅ Deployment completed!"
echo "🌐 Application URL: https://work.smartuniit.com"
echo "🔧 Backend API: https://work.smartuniit.com/api"
echo ""
echo "📋 Next steps:"
echo "1. Test authentication: https://work.smartuniit.com"
echo "2. Create superadmin user via API"
echo "3. Verify all modules are working"