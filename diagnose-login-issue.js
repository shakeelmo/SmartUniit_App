const fetch = require('node-fetch');

async function diagnoseLoginIssue() {
  console.log('🔍 Diagnosing Login Issue\n');
  
  // Test 1: Check if frontend is accessible
  console.log('1️⃣ Testing Frontend Accessibility...');
  try {
    const response = await fetch('http://localhost:5173/');
    if (response.ok) {
      console.log('✅ Frontend is accessible');
    } else {
      console.log(`❌ Frontend returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Frontend not accessible: ${error.message}`);
  }
  
  // Test 2: Check if backend is accessible
  console.log('\n2️⃣ Testing Backend Accessibility...');
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      console.log('✅ Backend is accessible');
    } else {
      console.log(`❌ Backend returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Backend not accessible: ${error.message}`);
  }
  
  // Test 3: Test login API directly
  console.log('\n3️⃣ Testing Login API...');
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend login API works');
      console.log(`   User: ${data.user.name} (${data.user.role})`);
      console.log(`   Token length: ${data.token.length}`);
    } else {
      const error = await response.text();
      console.log(`❌ Backend login failed: ${response.status} - ${error}`);
    }
  } catch (error) {
    console.log(`❌ Backend login error: ${error.message}`);
  }
  
  // Test 4: Test frontend proxy
  console.log('\n4️⃣ Testing Frontend Proxy...');
  try {
    const response = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend proxy works');
      console.log(`   User: ${data.user.name} (${data.user.role})`);
    } else {
      const error = await response.text();
      console.log(`❌ Frontend proxy failed: ${response.status} - ${error}`);
    }
  } catch (error) {
    console.log(`❌ Frontend proxy error: ${error.message}`);
  }
  
  // Test 5: Check if there are any JavaScript errors
  console.log('\n5️⃣ Checking for Common Issues...');
  
  // Check if servers are running
  try {
    const frontendResponse = await fetch('http://localhost:5173/');
    const backendResponse = await fetch('http://localhost:3001/api/health');
    
    if (frontendResponse.ok && backendResponse.ok) {
      console.log('✅ Both servers are running');
    } else {
      console.log('❌ One or both servers are not running properly');
    }
  } catch (error) {
    console.log(`❌ Server check failed: ${error.message}`);
  }
  
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Open http://localhost:5173/ in your browser');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab and look for errors');
  console.log('4. Go to Network tab and try to login');
  console.log('5. Check if the login request is being made');
  console.log('6. Check if there are any CORS errors');
  console.log('7. Try the debug page: http://localhost:5173/debug-login.html');
  
  console.log('\n🔧 Quick Fixes to Try:');
  console.log('1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
  console.log('2. Clear browser cache and cookies');
  console.log('3. Try in incognito/private mode');
  console.log('4. Check if any browser extensions are blocking requests');
  console.log('5. Try a different browser');
}

diagnoseLoginIssue();

