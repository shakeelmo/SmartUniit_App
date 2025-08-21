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

async function main() {
  try {
    console.log('🔧 Rebuilding users table in', dbPath);
    const cols = await all("PRAGMA table_info(users)");
    const hasPwd = cols.find(c => c.name === 'password');
    const hasPwdHash = cols.find(c => c.name === 'password_hash');

    // Only rebuild if constraints likely causing errors (either is NOT NULL)
    const needsRebuild = (hasPwd && hasPwd.notnull === 1) || (hasPwdHash && hasPwdHash.notnull === 1);
    if (!needsRebuild) {
      console.log('✅ Users table already compatible, no rebuild needed');
      return;
    }

    await run('BEGIN TRANSACTION');
    await run(`CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      phone TEXT,
      department TEXT,
      avatar_url TEXT
    )`);

    await run(`INSERT INTO users_new (id, name, email, password, password_hash, role, status, created_at, updated_at, phone, department, avatar_url)
               SELECT id, name, email, password, password_hash, role, status, created_at, updated_at, phone, department, avatar_url FROM users`);

    await run('DROP TABLE users');
    await run('ALTER TABLE users_new RENAME TO users');
    await run('COMMIT');
    console.log('✅ Users table rebuilt successfully');
  } catch (err) {
    console.error('❌ Failed to rebuild users table:', err);
    try { await run('ROLLBACK'); } catch {}
    process.exit(1);
  } finally {
    db.close();
  }
}

main();


