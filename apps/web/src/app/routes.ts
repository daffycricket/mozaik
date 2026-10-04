export type Route = { kind: 'board-list' } | { kind: 'board'; boardId: string };

const BOARD_PATH = /^\/b\/([^/]+)\/?$/;
const NAVIGATE_EVENT = 'mozaik:navigate';

/**
 * Maps a URL pathname to the route it represents.
 */
export function parsePath(pathname: string): Route {
  const boardId = BOARD_PATH.exec(pathname)?.[1];
  if (boardId !== undefined) {
    return { kind: 'board', boardId };
  }
  return { kind: 'board-list' };
}

/**
 * Pushes an internal path onto the history and notifies the router.
 */
export function navigate(to: string): void {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/**
 * Subscribes a listener to location changes (back/forward and internal navigation).
 */
export function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

/**
 * Returns the current URL pathname.
 */
export function getLocationPath(): string {
  return window.location.pathname;
}
