const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function migrateDatabase(dbPath) {
  return new Promise((resolve) => {
    const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    const db = new sqlite3.Database(absolutePath);

    const getColumns = () => {
      return new Promise((res, rej) => {
        db.all('PRAGMA table_info(quotations)', [], (err, rows) => {
          if (err) return rej(err);
          res(rows.map(r => r.name));
        });
      });
    };

    const addColumnIfMissing = async (colName, sql) => {
      const cols = await getColumns();
      if (!cols.includes(colName)) {
        await new Promise((res) => db.run(sql, [], () => res()));
        console.log(`${dbPath}: added ${colName}`);
      } else {
        console.log(`${dbPath}: ${colName} exists`);
      }
    };

    (async () => {
      try {
        await addColumnIfMissing('scope_of_work', 'ALTER TABLE quotations ADD COLUMN scope_of_work TEXT');
        await addColumnIfMissing('scope_of_work_ar', 'ALTER TABLE quotations ADD COLUMN scope_of_work_ar TEXT');
        db.close();
        resolve(true);
      } catch (e) {
        console.error(`${dbPath}: migration error`, e.message);
        db.close();
        resolve(false);
      }
    })();
  });
}

(async () => {
  const targets = [
    'data/smartuniit_taskflow.db',
    'server/database.sqlite',
  ];
  for (const t of targets) {
    await migrateDatabase(t);
  }
})();


