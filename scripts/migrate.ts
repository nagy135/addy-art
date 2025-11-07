import Database from 'better-sqlite3';

const dbPath = '.data/addy.sqlite';

function columnExists(db: Database.Database, table: string, column: string): boolean {
  const pragma = db.prepare(`PRAGMA table_info(${table});`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>;
  return pragma.some((c) => c.name === column);
}

function ensureParentIdOnCategories(db: Database.Database): void {
  if (!columnExists(db, 'categories', 'parent_id')) {
    db.exec(`ALTER TABLE categories ADD COLUMN parent_id INTEGER;`);
    // Note: In SQLite, adding a FK constraint post-table creation is non-trivial.
    // We keep it nullable without an enforced FK; Drizzle relations can still be used at the ORM level.
  }
}

function main(): void {
  const db = new Database(dbPath);
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    ensureParentIdOnCategories(db);
    // Add future migration steps here
    console.log('Migration completed.');
  } finally {
    db.close();
  }
}

main();



