const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Test role-based permissions
function testPermissions() {
  console.log('🔐 Testing Role-Based Permissions\n');
  
  // Define permissions matrix
  const permissions = {
    superadmin: {
      users: ['create', 'read', 'update', 'delete'],
      customers: ['create', 'read', 'update', 'delete'],
      vendors: ['create', 'read', 'update', 'delete'],
      projects: ['create', 'read', 'update', 'delete'],
      tasks: ['create', 'read', 'update', 'delete'],
      proposals: ['create', 'read', 'update', 'delete'],
      quotations: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update', 'delete'],
      budgets: ['create', 'read', 'update', 'delete'],
      deliveryNotes: ['create', 'read', 'update', 'delete']
    },
    admin: {
      users: ['create', 'read', 'update', 'delete'],
      customers: ['create', 'read', 'update', 'delete'],
      vendors: ['create', 'read', 'update', 'delete'],
      projects: ['create', 'read', 'update', 'delete'],
      tasks: ['create', 'read', 'update', 'delete'],
      proposals: ['create', 'read', 'update', 'delete'],
      quotations: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update', 'delete'],
      budgets: ['create', 'read', 'update', 'delete'],
      deliveryNotes: ['create', 'read', 'update', 'delete']
    },
    manager: {
      users: ['read'],
      customers: ['create', 'read', 'update'],
      vendors: ['create', 'read', 'update'],
      projects: ['create', 'read', 'update', 'delete'],
      tasks: ['create', 'read', 'update', 'delete'],
      proposals: ['create', 'read', 'update'],
      quotations: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update'],
      budgets: ['create', 'read', 'update'],
      deliveryNotes: ['create', 'read', 'update', 'delete']
    },
    staff: {
      users: [],
      customers: ['read'],
      vendors: ['read'],
      projects: ['read'],
      tasks: ['create', 'read', 'update'],
      proposals: ['read'],
      quotations: ['read'],
      invoices: ['read'],
      budgets: ['read'],
      deliveryNotes: []
    },
    customer: {
      users: [],
      customers: [],
      vendors: [],
      projects: ['read'],
      tasks: ['read'],
      proposals: ['read'],
      quotations: ['read'],
      invoices: ['read'],
      budgets: [],
      deliveryNotes: []
    },
    vendor: {
      users: [],
      customers: [],
      vendors: [],
      projects: ['read'],
      tasks: ['read'],
      proposals: ['read'],
      quotations: ['read'],
      invoices: [],
      budgets: [],
      deliveryNotes: []
    }
  };

  // Test function to check permissions
  function hasPermission(role, resource, action) {
    const rolePermissions = permissions[role];
    if (!rolePermissions) return false;
    
    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions.includes(action);
  }

  // Test cases
  const testCases = [
    // Super Admin tests
    { role: 'superadmin', resource: 'users', action: 'create', expected: true },
    { role: 'superadmin', resource: 'users', action: 'delete', expected: true },
    { role: 'superadmin', resource: 'customers', action: 'read', expected: true },
    { role: 'superadmin', resource: 'invoices', action: 'delete', expected: true },
    
    // Admin tests
    { role: 'admin', resource: 'users', action: 'create', expected: true },
    { role: 'admin', resource: 'users', action: 'delete', expected: true },
    { role: 'admin', resource: 'customers', action: 'read', expected: true },
    { role: 'admin', resource: 'invoices', action: 'delete', expected: true },
    
    // Manager tests
    { role: 'manager', resource: 'users', action: 'create', expected: false },
    { role: 'manager', resource: 'users', action: 'read', expected: true },
    { role: 'manager', resource: 'customers', action: 'create', expected: true },
    { role: 'manager', resource: 'customers', action: 'delete', expected: false },
    { role: 'manager', resource: 'projects', action: 'delete', expected: true },
    { role: 'manager', resource: 'invoices', action: 'delete', expected: false },
    
    // Staff tests
    { role: 'staff', resource: 'users', action: 'read', expected: false },
    { role: 'staff', resource: 'customers', action: 'read', expected: true },
    { role: 'staff', resource: 'customers', action: 'create', expected: false },
    { role: 'staff', resource: 'tasks', action: 'create', expected: true },
    { role: 'staff', resource: 'tasks', action: 'delete', expected: false },
    { role: 'staff', resource: 'invoices', action: 'create', expected: false },
    
    // Customer tests
    { role: 'customer', resource: 'users', action: 'read', expected: false },
    { role: 'customer', resource: 'projects', action: 'read', expected: true },
    { role: 'customer', resource: 'projects', action: 'create', expected: false },
    { role: 'customer', resource: 'quotations', action: 'read', expected: true },
    { role: 'customer', resource: 'quotations', action: 'create', expected: false },
    
    // Vendor tests
    { role: 'vendor', resource: 'users', action: 'read', expected: false },
    { role: 'vendor', resource: 'projects', action: 'read', expected: true },
    { role: 'vendor', resource: 'quotations', action: 'read', expected: true },
    { role: 'vendor', resource: 'quotations', action: 'create', expected: false },
    { role: 'vendor', resource: 'invoices', action: 'read', expected: false }
  ];

  console.log('Testing Permission Matrix:\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = hasPermission(testCase.role, testCase.resource, testCase.action);
    const status = result === testCase.expected ? '✅' : '❌';
    const expectedText = testCase.expected ? 'ALLOW' : 'DENY';
    const actualText = result ? 'ALLOW' : 'DENY';
    
    console.log(`${index + 1}. ${status} ${testCase.role} → ${testCase.resource}:${testCase.action} (Expected: ${expectedText}, Got: ${actualText})`);
    
    if (result === testCase.expected) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log(`\n📊 Permission Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  // Test JWT token with different roles
  console.log('\n🔑 Testing JWT Token Generation for Different Roles:\n');
  
  const roles = ['superadmin', 'admin', 'manager', 'staff', 'customer', 'vendor'];
  
  roles.forEach(role => {
    const token = jwt.sign(
      { 
        userId: `user-${Date.now()}`,
        email: `${role}@example.com`,
        role: role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ ${role} token generated and verified: ${decoded.role === role ? 'Valid' : 'Invalid'}`);
  });
  
  // Test permission summary for each role
  console.log('\n📋 Permission Summary by Role:\n');
  
  roles.forEach(role => {
    const rolePermissions = permissions[role];
    const totalPermissions = Object.keys(rolePermissions).reduce((total, resource) => {
      return total + rolePermissions[resource].length;
    }, 0);
    
    console.log(`${role.toUpperCase()}:`);
    console.log(`  Total permissions: ${totalPermissions}`);
    console.log(`  Resources: ${Object.keys(rolePermissions).join(', ')}`);
    console.log('');
  });
  
  return { passed, failed, total: testCases.length };
}

// Run the test
const results = testPermissions();

if (results.failed === 0) {
  console.log('🎉 All permission tests passed!');
} else {
  console.log(`⚠️  ${results.failed} permission tests failed.`);
}

