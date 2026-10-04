import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { openDatabase } from './index';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('[T-003-AC2] database opening', () => {
  test('[T-003-AC2] opens a file database in WAL mode and reruns migrations safely', () => {
    const directory = mkdtempSync(join(tmpdir(), 'mozaik-db-'));
    directories.push(directory);
    const path = join(directory, 'board.sqlite');

    const first = openDatabase(path);
    expect(first.pragma('journal_mode', { simple: true })).toBe('wal');
    first.close();

    const second = openDatabase(path);
    expect(second.pragma('journal_mode', { simple: true })).toBe('wal');
    const tables = second
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;
    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining(['boards', 'documents', 'schema_migrations']),
    );
    second.close();
  });
});
