// Simple API smoke test across core modules
const http = require('http');

const BASE = 'http://localhost:3001/api';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const url = new URL(path.startsWith('http') ? path : BASE + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + (url.search || ''),
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;
    const r = http.request(options, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          const json = buf ? JSON.parse(buf) : {};
          resolve({ status: res.statusCode, json });
        } catch (e) {
          resolve({ status: res.statusCode, text: buf });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function login() {
  const { status, json } = await req('POST', '/auth/login', {
    email: 'admin@smartuniit.com',
    password: 'admin123',
  });
  if (status !== 200 || !json.token) throw new Error('Login failed');
  return json.token;
}

async function smoke(token, label, path) {
  const { status, json, text } = await req('GET', path, null, token);
  if (status >= 200 && status < 300) {
    console.log(`✅ ${label}: OK (${status})`);
  } else {
    console.log(`❌ ${label}: ${status}`);
    console.log(' Response:', json || text);
  }
}

async function main() {
  try {
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Auth OK');

    // Customers, Vendors, Projects
    await smoke(token, 'Customers list', '/customers?limit=3');
    await smoke(token, 'Vendors list', '/vendors?limit=3');
    await smoke(token, 'Projects list', '/projects?limit=3');

    // Proposals, Quotations, Invoices
    await smoke(token, 'Proposals list', '/proposals?limit=3');
    await smoke(token, 'Quotations list', '/quotations?limit=3');
    await smoke(token, 'Invoices list', '/invoices?limit=3');

    // Delivery Notes, Budgets, Expenses
    await smoke(token, 'Delivery notes list', '/delivery-notes?limit=3');
    await smoke(token, 'Budgets list', '/budgets?limit=3');
    await smoke(token, 'Expenses list', '/expenses?limit=3');

    // Expenses categories and cash-flow
    await smoke(token, 'Expense categories', '/expenses/categories/all');
    await smoke(token, 'Cash flow summary', '/expenses/reports/cash-flow');

    console.log('🏁 Smoke tests complete');
  } catch (e) {
    console.error('❌ Smoke test failed:', e.message);
    process.exit(1);
  }
}

main();


