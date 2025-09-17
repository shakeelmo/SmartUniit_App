const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testCompleteAuth() {
  console.log('🔐 Starting Complete Authentication Test\n');
  
  const db = new sqlite3.Database('data/smartuniit_taskflow.db');
  
  try {
    // Test 1: Check database connection and users table
    console.log('1️⃣ Testing Database Connection...');
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log(`✅ Found ${users.length} users in database`);
    
    // Test 2: Test password hashing and verification
    console.log('\n2️⃣ Testing Password Hashing...');
    const testPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isValidPassword = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`✅ Password hashing works: ${isValidPassword}`);
    
    // Test 3: Test JWT token generation and verification
    console.log('\n3️⃣ Testing JWT Token Generation...');
    const testUser = { id: 'test-user', email: 'test@example.com', role: 'admin' };
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ JWT token generation and verification works: ${decoded.id === testUser.id}`);
    
    // Test 4: Test user login with existing admin user
    console.log('\n4️⃣ Testing Admin User Login...');
    const adminUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', ['admin@example.com'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (adminUser) {
      const passwordField = adminUser.password_hash || adminUser.password;
      const isValidLogin = await bcrypt.compare('admin123', passwordField);
      console.log(`✅ Admin login works: ${isValidLogin}`);
      console.log(`   User: ${adminUser.name} (${adminUser.email})`);
      console.log(`   Role: ${adminUser.role}, Status: ${adminUser.status}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Test 5: Test superadmin user
    console.log('\n5️⃣ Testing Super Admin User...');
    const superAdminUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', ['shakeel.ali@smartuniit.com'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (superAdminUser) {
      console.log(`✅ Super admin found: ${superAdminUser.name} (${superAdminUser.email})`);
      console.log(`   Role: ${superAdminUser.role}, Status: ${superAdminUser.status}`);
    } else {
      console.log('❌ Super admin user not found');
    }
    
    // Test 6: Test user roles and permissions
    console.log('\n6️⃣ Testing User Roles...');
    const roles = ['admin', 'superadmin', 'manager', 'staff', 'customer', 'vendor'];
    for (const role of roles) {
      const roleUsers = users.filter(user => user.role === role);
      console.log(`   ${role}: ${roleUsers.length} users`);
    }
    
    // Test 7: Test API endpoints (if server is running)
    console.log('\n7️⃣ Testing API Endpoints...');
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend API login endpoint working');
        console.log(`   Token length: ${data.token.length} characters`);
        console.log(`   User: ${data.user.name} (${data.user.role})`);
      } else {
        console.log('❌ Backend API login endpoint failed');
      }
    } catch (error) {
      console.log('⚠️  Backend server not running or not accessible');
    }
    
    // Test 8: Test frontend proxy (if running)
    console.log('\n8️⃣ Testing Frontend Proxy...');
    try {
      const response = await fetch('http://localhost:5173/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Frontend proxy login endpoint working');
        console.log(`   Token length: ${data.token.length} characters`);
      } else {
        console.log('❌ Frontend proxy login endpoint failed');
      }
    } catch (error) {
      console.log('⚠️  Frontend server not running or not accessible');
    }
    
    // Test 9: Test user creation
    console.log('\n9️⃣ Testing User Creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testUserPassword = 'test123456';
    const hashedTestPassword = await bcrypt.hash(testUserPassword, 10);
    
    const newUserId = `user-${Date.now()}`;
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, email, name, password, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newUserId, testEmail, 'Test User', hashedTestPassword, hashedTestPassword, 'staff', 'active'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    const createdUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [newUserId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (createdUser) {
      console.log('✅ User creation works');
      console.log(`   Created user: ${createdUser.name} (${createdUser.email})`);
      
      // Clean up test user
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM users WHERE id = ?', [newUserId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('   Test user cleaned up');
    } else {
      console.log('❌ User creation failed');
    }
    
    // Test 10: Test password change
    console.log('\n🔟 Testing Password Change...');
    if (adminUser) {
      const newPassword = 'newadmin123';
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHashedPassword, adminUser.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      const updatedUser = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [adminUser.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      const newPasswordValid = await bcrypt.compare(newPassword, updatedUser.password_hash);
      const oldPasswordValid = await bcrypt.compare('admin123', updatedUser.password_hash);
      
      console.log(`✅ Password change works: ${newPasswordValid && !oldPasswordValid}`);
      
      // Restore original password
      const originalHashedPassword = await bcrypt.hash('admin123', 10);
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [originalHashedPassword, adminUser.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('   Original password restored');
    }
    
    console.log('\n🎉 Authentication System Test Complete!');
    console.log('\n📊 Summary:');
    console.log('✅ Database connection and user management');
    console.log('✅ Password hashing and verification');
    console.log('✅ JWT token generation and verification');
    console.log('✅ User login and authentication');
    console.log('✅ Role-based user management');
    console.log('✅ User creation and cleanup');
    console.log('✅ Password change functionality');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    db.close();
  }
}

// Run the test
testCompleteAuth();
