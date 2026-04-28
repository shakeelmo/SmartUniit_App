const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/workflow.db');
const db = new sqlite3.Database(dbPath);

const users = [
  { id: 'seed-user-omer', name: 'M. Omer', email: 'm.omer@smartuniit.com', role: 'admin', password: 'admin123' },
  { id: 'seed-user-shakeel', name: 'Shakeel Ali', email: 'shakeel.ali@smartuniit.com', role: 'superadmin', password: 'admin123' },
  { id: 'seed-user-jaweed', name: 'M. Jaweed', email: 'm.jaweed@smartuniit.com', role: 'manager', password: 'admin123' },
  { id: 'seed-user-admin', name: 'Admin', email: 'admin@smartuniit.com', role: 'admin', password: 'admin123' },
  { id: 'seed-user-manager', name: 'Manager', email: 'manager@smartuniit.com', role: 'manager', password: 'password123' },
];

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function ensureColumns() {
  const columns = await new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(users)', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const names = new Set(columns.map((c) => c.name));
  if (!names.has('password_hash') && names.has('password')) {
    return { usePasswordHash: false, usePassword: true };
  }
  return { usePasswordHash: names.has('password_hash'), usePassword: names.has('password') };
}

async function seed() {
  const schema = await ensureColumns();

  for (const user of users) {
    const existing = await get('SELECT id FROM users WHERE lower(email) = lower(?)', [user.email]);
    const hashed = await bcrypt.hash(user.password, 10);

    if (existing) {
      const fields = ['name = ?', 'email = ?', 'role = ?', 'status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [user.name, user.email.toLowerCase(), user.role, 'active'];

      if (schema.usePasswordHash) {
        fields.push('password_hash = ?');
        params.push(hashed);
      }
      if (schema.usePassword) {
        fields.push('password = ?');
        params.push(hashed);
      }

      params.push(existing.id);
      await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
      console.log(`Updated ${user.email}`);
    } else {
      const columns = ['id', 'name', 'email', 'role', 'status'];
      const values = [user.id, user.name, user.email.toLowerCase(), user.role, 'active'];
      const placeholders = ['?', '?', '?', '?', '?'];

      if (schema.usePasswordHash) {
        columns.push('password_hash');
        placeholders.push('?');
        values.push(hashed);
      }
      if (schema.usePassword) {
        columns.push('password');
        placeholders.push('?');
        values.push(hashed);
      }

      await run(`INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
      console.log(`Inserted ${user.email}`);
    }
  }

  db.close();
}

seed().catch((err) => {
  console.error(err);
  db.close();
  process.exit(1);
});
