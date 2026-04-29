const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const primaryDbPath = path.join(__dirname, '../data/smartuniit_taskflow.db');
const legacyDbPath = path.join(__dirname, '../data/workflow.db');

const fileSize = (p) => {
  try {
    return fs.existsSync(p) ? fs.statSync(p).size : 0;
  } catch {
    return 0;
  }
};

const hasUsersTableSync = (dbFile) => {
  try {
    if (!fs.existsSync(dbFile) || fs.statSync(dbFile).size === 0) return false;
    const header = fs.readFileSync(dbFile, { encoding: 'utf8' });
    return header.includes('users') || header.includes('CREATE TABLE users');
  } catch {
    return false;
  }
};

const primarySize = fileSize(primaryDbPath);
const legacySize = fileSize(legacyDbPath);
const primaryHasUsers = hasUsersTableSync(primaryDbPath);
const legacyHasUsers = hasUsersTableSync(legacyDbPath);

const dbPath = primaryHasUsers
  ? primaryDbPath
  : legacyHasUsers
    ? legacyDbPath
    : primarySize > 0
      ? primaryDbPath
      : legacySize > 0
        ? legacyDbPath
        : primaryDbPath;

console.log('Using SQLite database:', dbPath, `(primary=${primarySize} bytes, legacy=${legacySize} bytes, primaryHasUsers=${primaryHasUsers}, legacyHasUsers=${legacyHasUsers})`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    db.run('PRAGMA foreign_keys = ON');
  }
});

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const beginTransaction = () => run('BEGIN TRANSACTION');
const commit = () => run('COMMIT');
const rollback = () => run('ROLLBACK');

module.exports = {
  db,
  run,
  get,
  all,
  beginTransaction,
  commit,
  rollback
};
