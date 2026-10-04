import { afterEach, describe, expect, test, vi } from 'vitest';
import { readBoard } from './board-read';

const board = {
  id: 'abc123456789',
  name: 'Rétro S12',
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

describe('readBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('returns the board when it exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(board), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    await expect(readBoard(board.id)).resolves.toEqual({ status: 'found', board });
  });

  test('[F01-S5-AC1] returns a missing result without logging when the board does not exist', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));

    await expect(readBoard('missing')).resolves.toEqual({ status: 'missing' });
    expect(error).not.toHaveBeenCalled();
  });

  test('logs and returns a missing result on another read failure', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));

    await expect(readBoard(board.id)).resolves.toEqual({ status: 'missing' });
    expect(error).toHaveBeenCalled();
  });
});
