#!/bin/bash

echo "🚀 Complete Application Fix Script"
echo "=================================="

echo "📋 Step 1: Stopping server..."
pm2 stop smartuniit-backend

echo "📋 Step 2: Checking current status..."
echo "PM2 Status:"
pm2 status

echo ""
echo "📋 Step 3: Checking server ports..."
netstat -tlnp | grep :3001

echo ""
echo "�� Step 4: Checking Nginx status..."
systemctl status nginx --no-pager -l

echo ""
echo "📋 Step 5: Checking frontend files..."
ls -la ../dist/

echo ""
echo "📋 Step 6: Starting server fresh..."
pm2 start smartuniit-backend

echo ""
echo "📋 Step 7: Waiting for server to start..."
sleep 5

echo ""
echo "📋 Step 8: Testing local API..."
curl -s http://localhost:3001/api/health

echo ""
echo "📋 Step 9: Testing domain access..."
curl -I http://work.smartuniit.com

echo ""
echo "📋 Step 10: Checking server logs..."
pm2 logs smartuniit-backend --lines 10

echo ""
echo "🎯 Fix script completed!"
echo "Check the output above for any errors."
