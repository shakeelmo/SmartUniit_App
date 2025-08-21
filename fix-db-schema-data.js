const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Target the DB that the backend actually uses
const dbPath = path.join(__dirname, 'data', 'smartuniit_taskflow.db');
const db = new sqlite3.Database(dbPath);

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function ensureColumns(tableName, columnSqlPairs) {
  const cols = await allQuery(`PRAGMA table_info(${tableName})`);
  const names = cols.map(c => c.name);
  console.log(`Current ${tableName} columns:`, names);
  for (const { column, sql } of columnSqlPairs) {
    if (!names.includes(column)) {
      console.log(`➕ Adding ${column} to ${tableName}...`);
      await runQuery(sql);
    } else {
      console.log(`✅ ${tableName}.${column} already exists`);
    }
  }
}

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing schema in', dbPath);

    await ensureColumns('customers', [
      { column: 'company', sql: 'ALTER TABLE customers ADD COLUMN company TEXT' },
      { column: 'notes', sql: 'ALTER TABLE customers ADD COLUMN notes TEXT' },
      { column: 'created_by', sql: 'ALTER TABLE customers ADD COLUMN created_by TEXT' }
    ]);

    await ensureColumns('vendors', [
      { column: 'created_by', sql: 'ALTER TABLE vendors ADD COLUMN created_by TEXT' },
      { column: 'contact_person', sql: 'ALTER TABLE vendors ADD COLUMN contact_person TEXT' },
      { column: 'website', sql: 'ALTER TABLE vendors ADD COLUMN website TEXT' },
      { column: 'notes', sql: 'ALTER TABLE vendors ADD COLUMN notes TEXT' },
      { column: 'offering', sql: 'ALTER TABLE vendors ADD COLUMN offering TEXT' },
      { column: 'status', sql: 'ALTER TABLE vendors ADD COLUMN status TEXT DEFAULT "active"' }
    ]);

    await ensureColumns('users', [
      { column: 'password_hash', sql: 'ALTER TABLE users ADD COLUMN password_hash TEXT' },
      { column: 'phone', sql: 'ALTER TABLE users ADD COLUMN phone TEXT' },
      { column: 'department', sql: 'ALTER TABLE users ADD COLUMN department TEXT' },
      { column: 'avatar_url', sql: 'ALTER TABLE users ADD COLUMN avatar_url TEXT' }
    ]);

    console.log('✅ Schema fixes completed');
  } catch (err) {
    console.error('❌ Schema fix failed:', err);
  } finally {
    db.close();
  }
}

fixDatabaseSchema();


