import { describe, expect, test } from 'vitest';
import {
  createIdentity,
  loadStoredIdentity,
  MAX_NAME_LENGTH,
  storeIdentity,
  validateName,
} from './identity';

function memoryStorage(entries: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(entries));
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

describe('validateName', () => {
  test('accepts a trimmed name of up to 30 characters', () => {
    expect(validateName('  Lama Flamboyant  ')).toEqual({ ok: true, name: 'Lama Flamboyant' });
    expect(validateName('x'.repeat(MAX_NAME_LENGTH))).toEqual({
      ok: true,
      name: 'x'.repeat(MAX_NAME_LENGTH),
    });
  });

  test('rejects an empty or blank name', () => {
    expect(validateName('').ok).toBe(false);
    expect(validateName('   ').ok).toBe(false);
  });

  test('rejects a name longer than 30 characters', () => {
    expect(validateName('x'.repeat(MAX_NAME_LENGTH + 1)).ok).toBe(false);
  });

  test('rejects control characters', () => {
    expect(validateName('Ni\u0000co').ok).toBe(false);
  });
});

describe('identity storage', () => {
  test('creates an identity from a name and an id', () => {
    expect(createIdentity('Nico', 'id-1')).toEqual({ id: 'id-1', name: 'Nico' });
  });

  test('stores and loads the identity', () => {
    const storage = memoryStorage();
    storeIdentity({ id: 'id-1', name: 'Nico' }, storage);

    expect(loadStoredIdentity(storage)).toEqual({ id: 'id-1', name: 'Nico' });
  });

  test('returns null without a stored entry', () => {
    expect(loadStoredIdentity(memoryStorage())).toBeNull();
  });

  test('returns null for a corrupted or invalid entry', () => {
    expect(loadStoredIdentity(memoryStorage({ 'mozaik.identity': '{' }))).toBeNull();
    expect(
      loadStoredIdentity(
        memoryStorage({ 'mozaik.identity': JSON.stringify({ id: '', name: '' }) }),
      ),
    ).toBeNull();
  });
});
