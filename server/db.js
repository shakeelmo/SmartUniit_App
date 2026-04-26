const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const fs = require('fs');
const primaryDbPath = path.join(__dirname, '../data/smartuniit_taskflow.db');
const legacyDbPath = path.join(__dirname, '../data/workflow.db');
const shouldUsePrimary = fs.existsSync(primaryDbPath) && fs.statSync(primaryDbPath).size > 0;
const dbPath = shouldUsePrimary ? primaryDbPath : legacyDbPath;

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Helper function to run queries with promises
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

// Helper function to get single row
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

// Helper function to get multiple rows
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

// Helper function to begin transaction
const beginTransaction = () => {
  return run('BEGIN TRANSACTION');
};

// Helper function to commit transaction
const commit = () => {
  return run('COMMIT');
};

// Helper function to rollback transaction
const rollback = () => {
  return run('ROLLBACK');
};

module.exports = {
  db,
  run,
  get,
  all,
  beginTransaction,
  commit,
  rollback
}; 