import type { Database } from 'better-sqlite3';

type Migration = {
  version: number;
  statements: string;
};

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: `
      CREATE TABLE boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
];

/**
 * Applies the pending numbered migrations to the database.
 */
export function runMigrations(db: Database): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)');
  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as Array<{
    version: number;
  }>;
  const applied = new Set(appliedRows.map((row) => row.version));
  const record = db.prepare('INSERT INTO schema_migrations (version) VALUES (?)');
  const pending = MIGRATIONS.filter((migration) => !applied.has(migration.version));
  if (pending.length === 0) {
    return;
  }
  db.transaction(() => {
    for (const migration of pending) {
      db.exec(migration.statements);
      record.run(migration.version);
    }
  })();
}
