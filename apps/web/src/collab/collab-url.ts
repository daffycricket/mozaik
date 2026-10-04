/**
 * Builds the collaboration WebSocket URL for the current origin.
 */
export function collabUrl(location: { protocol: string; host: string }): string {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${location.host}/collab`;
}
