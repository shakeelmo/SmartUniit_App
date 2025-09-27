#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://127.0.0.1:3001/api';
let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Test credentials
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test result tracking
function logTest(testName, result, details = '') {
  if (result) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    const errorMsg = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;
    console.log(`❌ ${testName}: ${errorMsg}`);
    testResults.failed++;
    testResults.errors.push(`${testName}: ${errorMsg}`);
  }
}

// Authentication tests
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test login
  const loginResult = await apiCall('POST', '/auth/login', TEST_USER);
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    logTest('Login', true, `User: ${loginResult.data.user.email}, Role: ${loginResult.data.user.role}`);
  } else {
    logTest('Login', false, loginResult.error);
    return false;
  }
  
  // Test profile
  const profileResult = await apiCall('GET', '/auth/profile');
  logTest('Get Profile', profileResult.success, profileResult.error);
  
  return true;
}

// Customers module tests
async function testCustomers() {
  console.log('\n👥 Testing Customers Module...');
  
  const customerData = {
    name: 'Test Customer',
    email: `test@customer-${Date.now()}.com`,
    phone: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    company: 'Test Company'
  };
  
  // Create customer
  const createResult = await apiCall('POST', '/customers', customerData);
  let customerId = null;
  if (createResult.success) {
    customerId = createResult.data.id;
    logTest('Create Customer', true);
  } else {
    logTest('Create Customer', false, createResult.error);
  }
  
  // Get all customers
  const listResult = await apiCall('GET', '/customers');
  logTest('List Customers', listResult.success, listResult.error);
  
  // Get customer by ID
  if (customerId) {
    const getResult = await apiCall('GET', `/customers/${customerId}`);
    logTest('Get Customer by ID', getResult.success, getResult.error);
    
    // Update customer
    const updateData = { ...customerData, name: 'Updated Test Customer' };
    const updateResult = await apiCall('PUT', `/customers/${customerId}`, updateData);
    logTest('Update Customer', updateResult.success, updateResult.error);
    
    // Delete customer
    const deleteResult = await apiCall('DELETE', `/customers/${customerId}`);
    logTest('Delete Customer', deleteResult.success, deleteResult.error);
  }
}

// Vendors module tests
async function testVendors() {
  console.log('\n🏢 Testing Vendors Module...');
  
  const vendorData = {
    name: 'Test Vendor',
    email: `test@vendor-${Date.now()}.com`,
    phone: '+966501234567',
    address: 'Jeddah, Saudi Arabia',
    contact_person: 'John Doe'
  };
  
  // Create vendor
  const createResult = await apiCall('POST', '/vendors', vendorData);
  let vendorId = null;
  if (createResult.success) {
    vendorId = createResult.data.id;
    logTest('Create Vendor', true);
  } else {
    logTest('Create Vendor', false, createResult.error);
  }
  
  // Get all vendors
  const listResult = await apiCall('GET', '/vendors');
  logTest('List Vendors', listResult.success, listResult.error);
  
  // Get vendor by ID
  if (vendorId) {
    const getResult = await apiCall('GET', `/vendors/${vendorId}`);
    logTest('Get Vendor by ID', getResult.success, getResult.error);
    
    // Update vendor
    const updateData = { ...vendorData, name: 'Updated Test Vendor' };
    const updateResult = await apiCall('PUT', `/vendors/${vendorId}`, updateData);
    logTest('Update Vendor', updateResult.success, updateResult.error);
    
    // Delete vendor
    const deleteResult = await apiCall('DELETE', `/vendors/${vendorId}`);
    logTest('Delete Vendor', deleteResult.success, deleteResult.error);
  }
}

// Quotations module tests
async function testQuotations() {
  console.log('\n📋 Testing Quotations Module...');
  
  // First create a customer to get a valid customer_id
  const customerData = {
    name: 'Test Customer for Quotation',
    email: `testcustomer-${Date.now()}@example.com`,
    phone: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    company: 'Test Company'
  };
  
  const customerResult = await apiCall('POST', '/customers', customerData);
  let customerId = null;
  if (customerResult.success) {
    customerId = customerResult.data.customer.id;
  } else {
    logTest('Create Customer for Quotation', false, customerResult.error);
    return;
  }
  
  const quotationData = {
    customer_id: customerId,
    title: 'Test Quotation',
    description: 'Test quotation description',
    items: [
      {
        description: 'Test Item 1',
        quantity: 2,
        unit_price: 100.00,
        total: 200.00
      }
    ],
    subtotal: 200.00,
    tax_rate: 15,
    tax_amount: 30.00,
    total: 230.00,
    valid_until: '2025-12-31',
    status: 'draft'
  };
  
  // Create quotation
  const createResult = await apiCall('POST', '/quotations', quotationData);
  let quotationId = null;
  if (createResult.success) {
    quotationId = createResult.data.id;
    logTest('Create Quotation', true);
  } else {
    logTest('Create Quotation', false, createResult.error);
  }
  
  // Get all quotations
  const listResult = await apiCall('GET', '/quotations');
  logTest('List Quotations', listResult.success, listResult.error);
  
  // Get quotation by ID
  if (quotationId) {
    const getResult = await apiCall('GET', `/quotations/${quotationId}`);
    logTest('Get Quotation by ID', getResult.success, getResult.error);
    
    // Update quotation
    const updateData = { ...quotationData, title: 'Updated Test Quotation' };
    const updateResult = await apiCall('PUT', `/quotations/${quotationId}`, updateData);
    logTest('Update Quotation', updateResult.success, updateResult.error);
    
    // Delete quotation
    const deleteResult = await apiCall('DELETE', `/quotations/${quotationId}`);
    logTest('Delete Quotation', deleteResult.success, deleteResult.error);
  }
}

// Projects module tests
async function testProjects() {
  console.log('\n📁 Testing Projects Module...');
  
  // First create a customer to get a valid customer_id
  const customerData = {
    name: 'Test Customer for Project',
    email: `testcustomer2-${Date.now()}@example.com`,
    phone: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    company: 'Test Company'
  };
  
  const customerResult = await apiCall('POST', '/customers', customerData);
  let customerId = null;
  if (customerResult.success) {
    customerId = customerResult.data.customer.id;
  } else {
    logTest('Create Customer for Project', false, customerResult.error);
    return;
  }
  
  const projectData = {
    title: 'Test Project',
    description: 'Test project description',
    customerId: customerId,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    budget: 10000.00,
    priority: 'medium'
  };
  
  // Create project
  const createResult = await apiCall('POST', '/projects', projectData);
  let projectId = null;
  if (createResult.success) {
    projectId = createResult.data.project.id;
    logTest('Create Project', true);
  } else {
    logTest('Create Project', false, createResult.error);
  }
  
  // Get all projects
  const listResult = await apiCall('GET', '/projects');
  logTest('List Projects', listResult.success, listResult.error);
  
  // Get project by ID
  if (projectId) {
    const getResult = await apiCall('GET', `/projects/${projectId}`);
    logTest('Get Project by ID', getResult.success, getResult.error);
    
    // Update project
    const updateData = { ...projectData, name: 'Updated Test Project' };
    const updateResult = await apiCall('PUT', `/projects/${projectId}`, updateData);
    logTest('Update Project', updateResult.success, updateResult.error);
    
    // Delete project
    const deleteResult = await apiCall('DELETE', `/projects/${projectId}`);
    logTest('Delete Project', deleteResult.success, deleteResult.error);
  }
}

// Proposals module tests
async function testProposals() {
  console.log('\n📄 Testing Proposals Module...');
  
  // First create a customer to get a valid customer_id
  const customerData = {
    name: 'Test Customer for Proposal',
    email: `testcustomer3-${Date.now()}@example.com`,
    phone: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    company: 'Test Company'
  };
  
  const customerResult = await apiCall('POST', '/customers', customerData);
  let customerId = null;
  if (customerResult.success) {
    customerId = customerResult.data.customer.id;
  } else {
    logTest('Create Customer for Proposal', false, customerResult.error);
    return;
  }
  
  const proposalData = {
    title: 'Test Proposal',
    description: 'Test proposal description',
    customerId: customerId,
    value: 5000.00
  };
  
  // Create proposal
  const createResult = await apiCall('POST', '/proposals', proposalData);
  let proposalId = null;
  if (createResult.success) {
    proposalId = createResult.data.id;
    logTest('Create Proposal', true);
  } else {
    logTest('Create Proposal', false, createResult.error);
  }
  
  // Get all proposals
  const listResult = await apiCall('GET', '/proposals');
  logTest('List Proposals', listResult.success, listResult.error);
  
  // Get proposal by ID
  if (proposalId) {
    const getResult = await apiCall('GET', `/proposals/${proposalId}`);
    logTest('Get Proposal by ID', getResult.success, getResult.error);
    
    // Update proposal
    const updateData = { ...proposalData, title: 'Updated Test Proposal' };
    const updateResult = await apiCall('PUT', `/proposals/${proposalId}`, updateData);
    logTest('Update Proposal', updateResult.success, updateResult.error);
    
    // Delete proposal
    const deleteResult = await apiCall('DELETE', `/proposals/${proposalId}`);
    logTest('Delete Proposal', deleteResult.success, deleteResult.error);
  }
}

// Invoices module tests
async function testInvoices() {
  console.log('\n🧾 Testing Invoices Module...');
  
  // First create a customer to get a valid customer_id
  const customerData = {
    name: 'Test Customer for Invoice',
    email: `testcustomer4-${Date.now()}@example.com`,
    phone: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    company: 'Test Company'
  };
  
  const customerResult = await apiCall('POST', '/customers', customerData);
  let customerId = null;
  if (customerResult.success) {
    customerId = customerResult.data.customer.id;
  } else {
    logTest('Create Customer for Invoice', false, customerResult.error);
    return;
  }
  
  const invoiceData = {
    customer_id: customerId,
    invoice_number: 'INV-001',
    amount: 1150.00,
    currency: 'SAR',
    due_date: '2025-12-31',
    lineItems: [
      {
        description: 'Test Service',
        quantity: 1,
        unit_price: 1000.00,
        total: 1000.00
      }
    ]
  };
  
  // Create invoice
  const createResult = await apiCall('POST', '/invoices', invoiceData);
  let invoiceId = null;
  if (createResult.success) {
    invoiceId = createResult.data.id;
    logTest('Create Invoice', true);
  } else {
    logTest('Create Invoice', false, createResult.error);
  }
  
  // Get all invoices
  const listResult = await apiCall('GET', '/invoices');
  logTest('List Invoices', listResult.success, listResult.error);
  
  // Get invoice by ID
  if (invoiceId) {
    const getResult = await apiCall('GET', `/invoices/${invoiceId}`);
    logTest('Get Invoice by ID', getResult.success, getResult.error);
    
    // Update invoice
    const updateData = { ...invoiceData, invoice_number: 'INV-002' };
    const updateResult = await apiCall('PUT', `/invoices/${invoiceId}`, updateData);
    logTest('Update Invoice', updateResult.success, updateResult.error);
    
    // Delete invoice
    const deleteResult = await apiCall('DELETE', `/invoices/${invoiceId}`);
    logTest('Delete Invoice', deleteResult.success, deleteResult.error);
  }
}

// Delivery Notes module tests
async function testDeliveryNotes() {
  console.log('\n📦 Testing Delivery Notes Module...');
  
  // First create a customer to get a valid customer_id
  const customerData = {
    name: 'Test Customer for Delivery Note',
    email: `testcustomer5-${Date.now()}@example.com`,
    phone: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    company: 'Test Company'
  };
  
  const customerResult = await apiCall('POST', '/customers', customerData);
  let customerId = null;
  if (customerResult.success) {
    customerId = customerResult.data.customer.id;
  } else {
    logTest('Create Customer for Delivery Note', false, customerResult.error);
    return;
  }
  
  const deliveryNoteData = {
    customer_id: customerId,
    delivery_date: '2025-01-15',
    recipient_name: 'John Doe',
    notes: 'Test delivery note',
    items: [
      {
        description: 'Test Item',
        quantity: 5,
        unit: 'pcs',
        remarks: 'Test remarks'
      }
    ]
  };
  
  // Create delivery note
  const createResult = await apiCall('POST', '/delivery-notes', deliveryNoteData);
  let deliveryNoteId = null;
  if (createResult.success) {
    deliveryNoteId = createResult.data.id;
    logTest('Create Delivery Note', true);
  } else {
    logTest('Create Delivery Note', false, createResult.error);
  }
  
  // Get all delivery notes
  const listResult = await apiCall('GET', '/delivery-notes');
  logTest('List Delivery Notes', listResult.success, listResult.error);
  
  // Get delivery note by ID
  if (deliveryNoteId) {
    const getResult = await apiCall('GET', `/delivery-notes/${deliveryNoteId}`);
    logTest('Get Delivery Note by ID', getResult.success, getResult.error);
    
    // Update delivery note
    const updateData = { ...deliveryNoteData, delivery_number: 'DN-002' };
    const updateResult = await apiCall('PUT', `/delivery-notes/${deliveryNoteId}`, updateData);
    logTest('Update Delivery Note', updateResult.success, updateResult.error);
    
    // Delete delivery note
    const deleteResult = await apiCall('DELETE', `/delivery-notes/${deliveryNoteId}`);
    logTest('Delete Delivery Note', deleteResult.success, deleteResult.error);
  }
}

// Budget module tests
async function testBudget() {
  console.log('\n💰 Testing Budget Module...');
  
  // First create a project to get a valid project_id
  const customerData = {
    name: 'Test Customer for Budget',
    email: `testcustomer6-${Date.now()}@example.com`,
    phone: '+966501234567',
    address: 'Riyadh, Saudi Arabia',
    company: 'Test Company'
  };
  
  const customerResult = await apiCall('POST', '/customers', customerData);
  let customerId = null;
  if (customerResult.success) {
    customerId = customerResult.data.customer.id;
  } else {
    logTest('Create Customer for Budget', false, customerResult.error);
    return;
  }
  
  const projectData = {
    title: 'Test Project for Budget',
    description: 'Test project description',
    customerId: customerId,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    budget: 10000.00,
    priority: 'medium'
  };
  
  const projectResult = await apiCall('POST', '/projects', projectData);
  let projectId = null;
  if (projectResult.success) {
    projectId = projectResult.data.project.id;
  } else {
    logTest('Create Project for Budget', false, projectResult.error);
    return;
  }
  
  const budgetData = {
    project_id: projectId,
    category: 'Development',
    description: 'Test budget item',
    amount: 5000.00,
    spent: 0.00,
    remaining: 5000.00,
    status: 'active'
  };
  
  // Create budget item
  const createResult = await apiCall('POST', '/budgets', budgetData);
  let budgetId = null;
  if (createResult.success) {
    budgetId = createResult.data.id;
    logTest('Create Budget Item', true);
  } else {
    logTest('Create Budget Item', false, createResult.error);
  }
  
  // Get all budget items
  const listResult = await apiCall('GET', '/budgets');
  logTest('List Budget Items', listResult.success, listResult.error);
  
  // Get budget item by ID
  if (budgetId) {
    const getResult = await apiCall('GET', `/budgets/${budgetId}`);
    logTest('Get Budget Item by ID', getResult.success, getResult.error);
    
    // Update budget item
    const updateData = { ...budgetData, amount: 6000.00 };
    const updateResult = await apiCall('PUT', `/budgets/${budgetId}`, updateData);
    logTest('Update Budget Item', updateResult.success, updateResult.error);
    
    // Delete budget item
    const deleteResult = await apiCall('DELETE', `/budgets/${budgetId}`);
    logTest('Delete Budget Item', deleteResult.success, deleteResult.error);
  }
}

// Expenses module tests (superadmin only)
async function testExpenses() {
  console.log('\n💸 Testing Expenses Module...');
  
  // Expenses module is restricted to superadmin only
  // Since we're using admin user, these should fail with permission error
  const expenseData = {
    category: 'Office Supplies',
    description: 'Test expense',
    amount: 100.00,
    date: '2025-01-15',
    vendor: 'Test Vendor',
    payment_method: 'cash',
    status: 'pending'
  };
  
  // Create expense (should fail - admin doesn't have permission)
  const createResult = await apiCall('POST', '/expenses', expenseData);
  logTest('Create Expense (Admin - Should Fail)', !createResult.success, createResult.error);
  
  // Get all expenses (should fail - admin doesn't have permission)
  const listResult = await apiCall('GET', '/expenses');
  logTest('List Expenses (Admin - Should Fail)', !listResult.success, listResult.error);
  
  // Test expense categories (should fail - admin doesn't have permission)
  const categoriesResult = await apiCall('GET', '/expenses/categories');
  logTest('Get Expense Categories (Admin - Should Fail)', !categoriesResult.success, categoriesResult.error);
  
  // Test cash flow summary (should fail - admin doesn't have permission)
  const cashFlowResult = await apiCall('GET', '/expenses/cash-flow');
  logTest('Get Cash Flow Summary (Admin - Should Fail)', !cashFlowResult.success, cashFlowResult.error);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Module Tests...\n');
  
  // Test authentication first
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log('❌ Authentication failed. Cannot proceed with other tests.');
    return;
  }
  
  // Run all module tests
  await testCustomers();
  await testVendors();
  await testQuotations();
  await testProjects();
  await testProposals();
  await testInvoices();
  await testDeliveryNotes();
  await testBudget();
  await testExpenses();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n✨ Test run completed!');
}

// Run tests
runAllTests().catch(console.error);
