export const E2E_WEB_PORT = 5173;
export const E2E_WEB_ORIGIN = `http://127.0.0.1:${E2E_WEB_PORT}`;

/**
 * Key of the identity entry written by `apps/web/src/identity/identity.ts`.
 */
export const IDENTITY_STORAGE_KEY = 'mozaik.identity';

export const E2E_USER = { id: 'e2e-user', name: 'Utilisateur E2E' };

/**
 * Playwright storage state with a memorized identity, so tests that only enter
 * a board do not have to fill the name dialog (see F10-S1).
 */
export function storedIdentityState(origin = E2E_WEB_ORIGIN): {
  cookies: [];
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
} {
  return identityState(E2E_USER.id, E2E_USER.name, origin);
}

/**
 * Playwright storage state with a given memorized identity, so two contexts
 * count as two distinct users (F09, F10).
 */
export function identityState(
  id: string,
  name: string,
  origin = E2E_WEB_ORIGIN,
): {
  cookies: [];
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
} {
  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [{ name: IDENTITY_STORAGE_KEY, value: JSON.stringify({ id, name }) }],
      },
    ],
  };
}
