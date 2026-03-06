import { Database } from 'bun:sqlite';

const skuDb = new Database(':memory:');
skuDb.run('CREATE TABLE skus (sku TEXT PRIMARY KEY) WITHOUT ROWID');
skuDb.run('PRAGMA journal_mode = OFF');
skuDb.run('PRAGMA synchronous = OFF');
skuDb.run('PRAGMA temp_store = MEMORY');

const skuInsertStmt = skuDb.prepare(
  'INSERT OR IGNORE INTO skus (sku) VALUES (?)',
);

export function markSkuIfNew(sku: string): boolean {
  return skuInsertStmt.run(sku).changes === 1;
}

export function clearSkuDedup() {
  skuDb.run('DELETE FROM skus');
}
