import Database from 'better-sqlite3';
import { runMigrations } from './migrations';

export type BoardDatabase = Database.Database;

/**
 * Opens the SQLite database, enables foreign keys and applies the migrations.
 */
export function openDatabase(path: string): BoardDatabase {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  if (path !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  runMigrations(db);
  return db;
}
