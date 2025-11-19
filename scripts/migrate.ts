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

function tableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?;")
    .get(table) as { name?: string } | undefined;
  return !!row && row.name === table;
}

function ensureProductImagesTableAndBackfill(db: Database.Database): void {
  if (!tableExists(db, 'product_images')) {
    db.exec(`
      CREATE TABLE product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        is_thumbnail INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_product_images_product_id ON product_images(product_id);
      CREATE INDEX idx_product_images_thumbnail ON product_images(product_id, is_thumbnail);
    `);
  }

  // Backfill: ensure each product has at least one image row using products.image_path
  const productsStmt = db.prepare('SELECT id, image_path FROM products;');
  const imagesCountStmt = db.prepare(
    'SELECT COUNT(1) as cnt FROM product_images WHERE product_id = ?;'
  );
  const insertImageStmt = db.prepare(
    'INSERT INTO product_images (product_id, image_path, is_thumbnail, created_at) VALUES (?, ?, ?, ?);'
  );

  const productsRows = productsStmt.all() as Array<{ id: number; image_path: string }>;
  const now = Date.now();
  const backfill = db.transaction(() => {
    for (const row of productsRows) {
      const countRow = imagesCountStmt.get(row.id) as { cnt: number } | undefined;
      const hasImages = !!countRow && Number(countRow.cnt) > 0;
      if (!hasImages && row.image_path) {
        insertImageStmt.run(row.id, row.image_path, 1, now);
      }
    }
  });
  backfill();
}

function ensureSortOrderOnProducts(db: Database.Database): void {
  if (!columnExists(db, 'products', 'sort_order')) {
    db.exec(`ALTER TABLE products ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;`);
  }

  // Backfill: for each category, set sort_order to position when ordering by created_at DESC
  const categoryIdsStmt = db.prepare('SELECT id FROM categories;');
  const productsByCategoryStmt = db.prepare(
    'SELECT id FROM products WHERE category_id = ? ORDER BY created_at DESC;'
  );
  const updateSortOrderStmt = db.prepare(
    'UPDATE products SET sort_order = ? WHERE id = ?;'
  );

  const categoryRows = categoryIdsStmt.all() as Array<{ id: number }>;
  const backfill = db.transaction(() => {
    for (const { id: categoryId } of categoryRows) {
      const productRows = productsByCategoryStmt.all(categoryId) as Array<{ id: number }>;
      let position = 1;
      for (const { id: productId } of productRows) {
        updateSortOrderStmt.run(position, productId);
        position += 1;
      }
    }
  });
  backfill();
}

function ensureSoldAtOnProducts(db: Database.Database): void {
  if (!columnExists(db, 'products', 'sold_at')) {
    db.exec(`ALTER TABLE products ADD COLUMN sold_at INTEGER;`);
  }
}

function ensureIsRecreatableOnProducts(db: Database.Database): void {
  if (!columnExists(db, 'products', 'is_recreatable')) {
    db.exec(`ALTER TABLE products ADD COLUMN is_recreatable INTEGER NOT NULL DEFAULT 0;`);
  }
}

function ensureSeenOnOrders(db: Database.Database): void {
  if (!columnExists(db, 'orders', 'seen')) {
    db.exec(`ALTER TABLE orders ADD COLUMN seen INTEGER NOT NULL DEFAULT 0;`);
  }
}

function ensureNoteOnOrders(db: Database.Database): void {
  if (!columnExists(db, 'orders', 'note')) {
    db.exec(`ALTER TABLE orders ADD COLUMN note TEXT;`);
  }
}

function main(): void {
  const db = new Database(dbPath);
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    ensureParentIdOnCategories(db);
    ensureProductImagesTableAndBackfill(db);
    ensureSortOrderOnProducts(db);
    ensureSoldAtOnProducts(db);
    ensureIsRecreatableOnProducts(db);
    ensureSeenOnOrders(db);
    ensureNoteOnOrders(db);
    // Add future migration steps here
    console.log('Migration completed.');
  } finally {
    db.close();
  }
}

main();






