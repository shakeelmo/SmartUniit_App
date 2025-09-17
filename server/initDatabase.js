const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error('Query error:', err);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('Query error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Query error:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const initDatabase = async () => {
  try {
    console.log('🔧 Initializing Database...');

    // Create users table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customers table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vendors table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create quotations table with all required columns
    await runQuery(`
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        quote_number TEXT UNIQUE,
        customer_id TEXT,
        total_amount REAL DEFAULT 0,
        currency TEXT DEFAULT 'SAR',
        status TEXT DEFAULT 'draft',
        valid_until TEXT,
        notes TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        subtotal REAL DEFAULT 0,
        discount_type TEXT DEFAULT 'percentage',
        discount_value REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        vat_rate REAL DEFAULT 15,
        vat_amount REAL DEFAULT 0,
        terms TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create quotation_line_items table with unit fields
    await runQuery(`
      CREATE TABLE IF NOT EXISTS quotation_line_items (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT DEFAULT 'piece',
        custom_unit TEXT,
        unit_price REAL NOT NULL DEFAULT 0,
        total_price REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
      )
    `);

    // Create other tables
    await runQuery(`
      CREATE TABLE IF NOT EXISTS proposals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        customer_id TEXT,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        customer_id TEXT,
        status TEXT DEFAULT 'active',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        project_id TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE,
        customer_id TEXT,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS delivery_notes (
        id TEXT PRIMARY KEY,
        note_number TEXT UNIQUE,
        customer_id TEXT,
        status TEXT DEFAULT 'draft',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create expense_categories table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create expenses table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category_id TEXT NOT NULL,
        payment_method TEXT DEFAULT 'bank_transfer',
        reference_number TEXT,
        vendor_id TEXT,
        project_id TEXT,
        user_id TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        due_date TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
        receipt_url TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES expense_categories(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert default admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await runQuery(`
      INSERT OR IGNORE INTO users (id, name, email, password, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin-1', 'Admin User', 'admin@example.com', hashedPassword, 'admin', 'active']);

    // Insert sample customer
    await runQuery(`
      INSERT OR IGNORE INTO customers (id, name, email, phone)
      VALUES (?, ?, ?, ?)
    `, ['customer-123', 'Sample Customer 1', 'customer@example.com', '+966501234567']);

    // Insert sample vendor
    await runQuery(`
      INSERT OR IGNORE INTO vendors (id, name, email, phone)
      VALUES (?, ?, ?, ?)
    `, ['vendor-123', 'Sample Vendor 1', 'vendor@example.com', '+966501234568']);

    // Insert default expense categories
    const expenseCategories = [
      // Income categories
      ['cat-inc-1', 'Sales Revenue', 'Revenue from product sales', 'income'],
      ['cat-inc-2', 'Service Revenue', 'Revenue from services provided', 'income'],
      ['cat-inc-3', 'Investment Income', 'Income from investments', 'income'],
      ['cat-inc-4', 'Other Income', 'Miscellaneous income sources', 'income'],
      
      // Expense categories
      ['cat-exp-1', 'Office Supplies', 'Office supplies and stationery', 'expense'],
      ['cat-exp-2', 'Rent & Utilities', 'Office rent and utility bills', 'expense'],
      ['cat-exp-3', 'Marketing & Advertising', 'Marketing and advertising expenses', 'expense'],
      ['cat-exp-4', 'Travel & Transportation', 'Business travel and transportation', 'expense'],
      ['cat-exp-5', 'Equipment & Software', 'Equipment purchases and software licenses', 'expense'],
      ['cat-exp-6', 'Professional Services', 'Legal, accounting, and consulting fees', 'expense'],
      ['cat-exp-7', 'Employee Benefits', 'Employee benefits and compensation', 'expense'],
      ['cat-exp-8', 'Insurance', 'Business insurance premiums', 'expense'],
      ['cat-exp-9', 'Maintenance & Repairs', 'Equipment and facility maintenance', 'expense'],
      ['cat-exp-10', 'Other Expenses', 'Miscellaneous business expenses', 'expense']
    ];

    for (const [id, name, description, type] of expenseCategories) {
      await runQuery(`
        INSERT OR IGNORE INTO expense_categories (id, name, description, type)
        VALUES (?, ?, ?, ?)
      `, [id, name, description, type]);
    }

    console.log('✅ Database initialized successfully!');
    
    // Show table info
    const tables = await allQuery("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 Available tables:', tables.map(t => t.name));

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    db.close();
  }
};

initDatabase(); 