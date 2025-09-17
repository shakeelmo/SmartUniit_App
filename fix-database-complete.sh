#!/bin/bash

echo "🚀 Complete Database Fix Script"
echo "================================"

echo "📋 Step 1: Stopping server..."
pm2 stop smartuniit-backend

echo "�� Step 2: Backing up database..."
cp ../data/smartuniit_taskflow.db ../data/smartuniit_taskflow.db.backup 2>/dev/null || echo "No existing database to backup"

echo "📋 Step 3: Removing incomplete database..."
rm -f ../data/smartuniit_taskflow.db

echo "📋 Step 4: Starting server..."
pm2 start smartuniit-backend

echo "📋 Step 5: Waiting for server to start..."
sleep 5

echo "📋 Step 6: Running database initialization..."
node initDatabase.js

echo "📋 Step 7: Running database setup..."
node setupDatabase.js

echo "📋 Step 8: Running migrations..."
node migrate.js

echo "📋 Step 9: Verifying database..."
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../data/smartuniit_taskflow.db');
db.all('SELECT name FROM sqlite_master WHERE type=\"table\"', (err, rows) => {
    if (err) {
        console.log('❌ Error:', err.message);
    } else {
        console.log('✅ All tables created successfully:');
        rows.forEach(row => console.log('-', row.name));
    }
    db.close();
});
"

echo "📋 Step 10: Testing API..."
echo "Getting fresh login token..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shakeel.ali@smartuniit.com","password":"VdiHaiAaj?"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Login successful, testing vendor creation..."
    curl -s -X POST http://localhost:3001/api/vendors \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"name":"Test Vendor","email":"test@vendor.com","phone":"1234567890"}'
else
    echo "❌ Login failed"
fi

echo ""
echo "🎯 Database fix completed!"
echo "Check the output above for any errors."
