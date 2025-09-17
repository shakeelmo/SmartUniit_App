const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'smartuniit_taskflow.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function ensureColumn(table, column, sqlAdd) {
  const cols = await all(`PRAGMA table_info(${table})`);
  const names = cols.map(c => c.name);
  if (!names.includes(column)) {
    console.log(`➕ Adding ${table}.${column}`);
    await run(sqlAdd);
  } else {
    console.log(`✅ ${table}.${column} exists`);
  }
}

async function main() {
  try {
    console.log('🔧 Fixing quotations schema in', dbPath);

    // Ensure quotations table has all expected columns
    const qCols = await all('PRAGMA table_info(quotations)');
    const qNames = qCols.map(c => c.name);
    console.log('Current quotations columns:', qNames);

    // Add quotation_number if missing; copy from quote_number if present
    if (!qNames.includes('quotation_number')) {
      await ensureColumn('quotations', 'quotation_number', 'ALTER TABLE quotations ADD COLUMN quotation_number TEXT');
      if (qNames.includes('quote_number')) {
        console.log('↪️ Copying values from quote_number to quotation_number');
        await run('UPDATE quotations SET quotation_number = quote_number WHERE quotation_number IS NULL');
      }
    }

    await ensureColumn('quotations', 'terms', 'ALTER TABLE quotations ADD COLUMN terms TEXT');
    await ensureColumn('quotations', 'subtotal', 'ALTER TABLE quotations ADD COLUMN subtotal REAL DEFAULT 0');
    await ensureColumn('quotations', 'discount_type', "ALTER TABLE quotations ADD COLUMN discount_type TEXT DEFAULT 'percentage'");
    await ensureColumn('quotations', 'discount_value', 'ALTER TABLE quotations ADD COLUMN discount_value REAL DEFAULT 0');
    await ensureColumn('quotations', 'discount_amount', 'ALTER TABLE quotations ADD COLUMN discount_amount REAL DEFAULT 0');
    await ensureColumn('quotations', 'vat_rate', 'ALTER TABLE quotations ADD COLUMN vat_rate REAL DEFAULT 15');
    await ensureColumn('quotations', 'vat_amount', 'ALTER TABLE quotations ADD COLUMN vat_amount REAL DEFAULT 0');
    await ensureColumn('quotations', 'created_by', 'ALTER TABLE quotations ADD COLUMN created_by TEXT');

    // Ensure quotation_line_items has expected columns
    const liCols = await all('PRAGMA table_info(quotation_line_items)');
    const liNames = liCols.map(c => c.name);
    console.log('Current quotation_line_items columns:', liNames);

    await ensureColumn('quotation_line_items', 'unit', "ALTER TABLE quotation_line_items ADD COLUMN unit TEXT DEFAULT 'piece'");
    await ensureColumn('quotation_line_items', 'custom_unit', 'ALTER TABLE quotation_line_items ADD COLUMN custom_unit TEXT');
    await ensureColumn('quotation_line_items', 'unit_price', 'ALTER TABLE quotation_line_items ADD COLUMN unit_price REAL DEFAULT 0');
    await ensureColumn('quotation_line_items', 'total_price', 'ALTER TABLE quotation_line_items ADD COLUMN total_price REAL DEFAULT 0');
    await ensureColumn('quotation_line_items', 'created_at', 'ALTER TABLE quotation_line_items ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    await ensureColumn('quotation_line_items', 'updated_at', 'ALTER TABLE quotation_line_items ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');

    console.log('✅ Quotations schema fixes completed');
  } catch (err) {
    console.error('❌ Failed to fix quotations schema:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();



