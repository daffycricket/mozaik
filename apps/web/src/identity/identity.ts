import { z } from 'zod';

export const MAX_NAME_LENGTH = 30;

const IDENTITY_STORAGE_KEY = 'mozaik.identity';

const identitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(MAX_NAME_LENGTH),
});

export type UserIdentity = z.infer<typeof identitySchema>;

export type NameValidation = { ok: true; name: string } | { ok: false; error: string };

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function storageOf(storage?: Storage): Storage | null {
  if (storage !== undefined) {
    return storage;
  }
  return typeof localStorage === 'undefined' ? null : localStorage;
}

/**
 * Validates a raw name: trimmed, 1 to 30 printable characters.
 */
export function validateName(raw: string): NameValidation {
  const name = raw.trim();
  if (name.length === 0) {
    return { ok: false, error: 'Saisis ton nom.' };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Ton nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.` };
  }
  if (hasControlCharacter(name)) {
    return { ok: false, error: 'Ton nom contient des caractères non autorisés.' };
  }
  return { ok: true, name };
}

/**
 * Builds an identity from a validated name and a random identifier.
 */
export function createIdentity(name: string, id: string): UserIdentity {
  return { id, name };
}

/**
 * Reads the memorized identity, ignoring an absent or invalid entry.
 */
export function loadStoredIdentity(storage?: Storage): UserIdentity | null {
  const target = storageOf(storage);
  if (target === null) {
    return null;
  }
  const raw = target.getItem(IDENTITY_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed = identitySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Memorizes the identity in the browser so it is not asked again.
 */
export function storeIdentity(identity: UserIdentity, storage?: Storage): void {
  const target = storageOf(storage);
  if (target === null) {
    return;
  }
  target.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
}
