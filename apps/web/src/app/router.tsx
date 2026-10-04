import { useSyncExternalStore } from 'react';
import { App } from './app';
import { getLocationPath, parsePath, subscribeToLocation } from './routes';

/**
 * Renders the application matching the current URL.
 */
export function Router() {
  const pathname = useSyncExternalStore(subscribeToLocation, getLocationPath, getLocationPath);
  return <App route={parsePath(pathname)} />;
}
