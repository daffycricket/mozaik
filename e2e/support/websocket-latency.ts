import type { Page } from '@playwright/test';

export type WebSocketLatencyStats = {
  clientToServer: number;
  serverToClient: number;
};

/**
 * Adds a configurable latency to the collaboration WebSocket messages, in both
 * directions, without touching the server (FL-1, FL-4).
 */
export async function addWebSocketLatency(
  page: Page,
  latencyMs: number,
  url: string | RegExp = /\/collab$/,
): Promise<WebSocketLatencyStats> {
  const stats: WebSocketLatencyStats = { clientToServer: 0, serverToClient: 0 };
  await page.routeWebSocket(url, (socket) => {
    const server = socket.connectToServer();
    socket.onMessage((message) => {
      stats.clientToServer += 1;
      setTimeout(() => {
        server.send(message);
      }, latencyMs);
    });
    server.onMessage((message) => {
      stats.serverToClient += 1;
      setTimeout(() => {
        socket.send(message);
      }, latencyMs);
    });
  });
  return stats;
}
