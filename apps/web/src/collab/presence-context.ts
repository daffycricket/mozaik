import type { HocuspocusProvider } from '@hocuspocus/provider';
import { createContext, useContext } from 'react';
import type { UserIdentity } from '@/identity/identity';

export type PresenceSession = {
  provider: HocuspocusProvider;
  identity: UserIdentity;
};

/**
 * Presence session of the board view: the collaboration provider and the local
 * identity used to publish the user cursor (F10-S2).
 */
export const PresenceContext = createContext<PresenceSession | null>(null);

/**
 * Returns the presence session, or `null` while the provider is not connected.
 */
export function usePresenceSession(): PresenceSession | null {
  return useContext(PresenceContext);
}
